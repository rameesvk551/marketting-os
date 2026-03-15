import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getRedisClient } from '../../config/redis.js';
import { getConfig } from '../../config/env.js';
import { AppError, UnauthorizedError } from '../../utils/apiError.js';
import * as authRepository from './auth.repository.js';
import axios from 'axios';
import { registerReferredCustomer, resolvePartnerByReferralCode } from '../partner/partner.service.js';
// Email module removed — stub until mailer is re-integrated
const sendEmail = async (to: string, subject: string, html: string) => {
    console.log(`[EMAIL STUB] To: ${to}, Subject: ${subject}`);
};
import type { RegisterDTO, LoginDTO, AuthResponse, TokenPayload } from './auth.types.js';
import { AUTH } from '../../config/constants.js';

// Since the class had optional billingOnboardingPort injected, we can either
// omit it in the functional approach or provide a way to inject it if strictly needed.
// For now, I'll omit the billing step or leave a TODO/import if required.
// If needed, import from billing service directly.
// import { billingService } from '../billing/index.js';

export const register = async (data: RegisterDTO): Promise<AuthResponse> => {
    const config = getConfig();
    const referralPartner = data.referralCode
        ? await resolvePartnerByReferralCode(data.referralCode)
        : null;

    // 1. Check if user already exists
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
        throw new AppError('User with this email already exists', 409);
    }

    // 2. Create Tenant
    const slug = data.tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Check if tenant with this slug already exists
    const existingTenant = await authRepository.findTenantBySlug(slug);
    if (existingTenant) {
        throw new AppError('A tenant with this name already exists', 409);
    }

    if (data.referralCode && !referralPartner) {
        throw new AppError('Invalid referral code', 400, 'INVALID_REFERRAL_CODE');
    }

    const tenant = await authRepository.createTenant({
        name: data.tenantName,
        slug,
        is_active: true,
    });

    // 3. Hash Password
    const salt = await bcrypt.genSalt(AUTH.SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // 4. Create User
    const user = await authRepository.createUser({
        tenant_id: tenant.id,
        email: data.email,
        password_hash: passwordHash,
        name: data.userName,
        role: 'admin',
        is_active: true,
    });

    if (referralPartner) {
        await registerReferredCustomer({
            businessName: tenant.name,
            email: user.email,
            partnerId: referralPartner.id,
            tenantId: tenant.id,
            plan: 'trial',
        });
    }

    // 5. Create billing trial if available (Placeholder to adapt billing integration if accessed globally)
    // if (billingService) {
    //     try {
    //         await billingService.createTrialForTenant({
    //             tenantId: tenant.id,
    //             performedByUserId: user.id,
    //         });
    //     } catch (error) {
    //         console.error('Failed to create billing trial during registration:', error);
    //     }
    // }

    // 6. Generate Token
    const token = generateToken(user.id, tenant.id, user.role);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: tenant.id,
            tenantName: tenant.name,
        },
        token,
    };
};

export const login = async (data: LoginDTO): Promise<AuthResponse> => {
    // 1. Find User with tenant
    const user = await authRepository.findUserByEmailWithTenant(data.email);
    if (!user) {
        throw new UnauthorizedError('Invalid email or password');
    }

    // 2. Validate Password
    const isMatch = await bcrypt.compare(data.password, user.password_hash);
    if (!isMatch) {
        throw new UnauthorizedError('Invalid email or password');
    }

    // 3. Check if active
    if (!user.is_active) {
        throw new UnauthorizedError('Account is disabled');
    }

    // 4. Generate Token
    const token = generateToken(user.id, user.tenant_id, user.role);

    let tenantName = 'Unknown';
    if (user.tenant) {
        tenantName = user.tenant.name;
    } else {
        const tenant = await authRepository.findTenantById(user.tenant_id);
        if (tenant) tenantName = tenant.name;
    }

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenant_id,
            tenantName,
        },
        token,
    };
};

export const validateToken = (token: string): TokenPayload => {
    const config = getConfig();
    try {
        const decoded = jwt.verify(token, config.jwt.secret) as any;
        return {
            userId: decoded.id,
            tenantId: decoded.tenantId,
            role: decoded.role,
        };
    } catch (error) {
        throw new UnauthorizedError('Invalid token');
    }
};

export const forgotPassword = async (email: string): Promise<void> => {
    const redisClient = getRedisClient();
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
        console.log(`Password reset requested for non-existent email: ${email}`);
        return;
    }

    const resetToken = uuidv4();

    if (redisClient) {
        await redisClient.setex(`reset_token:${resetToken}`, AUTH.RESET_TOKEN_TTL, user.id);
    } else {
        throw new AppError('Password reset service unavailable', 503);
    }

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const html = `
        <h3>Password Reset Request</h3>
        <p>You requested to reset your password.</p>
        <p>Click the link below to reset it (valid for 15 minutes):</p>
        <a href="${resetLink}">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
    `;

    await sendEmail(user.email, 'Password Reset Request', html);
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    const redisClient = getRedisClient();
    if (!redisClient) {
        throw new AppError('Password reset service unavailable', 503);
    }

    const userId = await redisClient.get(`reset_token:${token}`);
    if (!userId) {
        throw new AppError('Invalid or expired reset token', 400);
    }

    const salt = await bcrypt.genSalt(AUTH.SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const user = await authRepository.updateUserPassword(userId, passwordHash);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    await redisClient.del(`reset_token:${token}`);
};

export const getMetaLoginUrl = async (redirectUri: string, state: string): Promise<string> => {
    const config = getConfig();
    const appId = config.whatsapp.meta?.appId;
    if (!appId) {
        throw new AppError('Meta App ID is not configured', 500);
    }

    const { apiVersion } = config.whatsapp.meta || {};
    const version = apiVersion || 'v21.0';
    const scope = 'whatsapp_business_management,whatsapp_business_messaging,business_management,whatsapp_business_manage_events,manage_app_solution,email,public_profile';
    return `https://www.facebook.com/${version}/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;
};

export const handleMetaCallback = async (code: string, state: string, redirectUri: string): Promise<any> => {
    const config = getConfig();
    const appId = config.whatsapp.meta?.appId;
    const appSecret = config.whatsapp.meta?.appSecret;
    const { apiVersion } = config.whatsapp.meta || {};
    const version = apiVersion || 'v21.0';

    if (!appId || !appSecret) {
        throw new AppError('Meta App ID or App Secret is not configured', 500);
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.get(`https://graph.facebook.com/${version}/oauth/access_token`, {
            params: {
                client_id: appId,
                redirect_uri: redirectUri,
                client_secret: appSecret,
                code,
            }
        });

        const metaAccessToken = tokenResponse.data.access_token;
        if (!metaAccessToken) {
            throw new AppError('Failed to retrieve Meta access token', 400);
        }

        // The state contains the JWT or we can decode it to get the user ID
        // In our validateToken, we expect a valid encoded JWT
        const decoded = validateToken(state);
        const userId = decoded.userId;

        // Optionally fetch user info to verify
        // const meResponse = await axios.get(`https://graph.facebook.com/${version}/me?access_token=${metaAccessToken}`);

        await authRepository.updateUserMeta(userId, {
            metaAccessToken
        });

        return {
            success: true,
            message: 'Meta accounts linked successfully',
            metaAccessToken: 'HIDDEN' // Don't return the raw token for security, maybe just a success flag
        };
    } catch (error: any) {
        console.error('Meta Callback Error:', error.response?.data || error.message);
        throw new AppError(error.response?.data?.error?.message || 'Failed to link Meta account', 400);
    }
};

const generateToken = (userId: string, tenantId: string, role: string): string => {
    const config = getConfig();
    return jwt.sign(
        { id: userId, tenantId, role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );
};

import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Typography, Avatar, Badge, Tooltip, Drawer, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
    RocketOutlined,
    SettingOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    BellOutlined,
    WhatsAppOutlined,
    InstagramOutlined,
    CloseOutlined,
    ShopOutlined,
    AppstoreOutlined,
    ShoppingCartOutlined,
    UserOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';

const { Sider, Content } = Layout;
const { Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

const configureBusinessChildren = [
    { key: '/configure-business/profile', label: 'Business Profile' },
    { key: '/configure-business/products', icon: <AppstoreOutlined />, label: 'Products' },
    { key: '/configure-business/categories', icon: <AppstoreOutlined />, label: 'Categories' },
    { key: '/configure-business/orders', icon: <ShoppingCartOutlined />, label: 'Orders' },
    { key: '/configure-business/payment-settings', label: 'Payment Settings' },
];

const navItems: MenuItem[] = [
    {
        key: '/whatsapp',
        icon: <WhatsAppOutlined />,
        label: 'WhatsApp',
    },
    {
        key: '/instagram',
        icon: <InstagramOutlined />,
        label: 'Instagram',
    },
    {
        type: 'divider',
    },
    {
        key: '/configure-business',
        icon: <ShopOutlined />,
        label: 'Configure Business',
        children: configureBusinessChildren,
    },
    {
        key: '/settings',
        icon: <SettingOutlined />,
        label: 'Settings',
    },
];

const mobilePrimaryNav = [
    {
        key: '/whatsapp',
        label: 'WA',
        icon: <WhatsAppOutlined />,
        matches: (path: string) => path.startsWith('/whatsapp'),
    },
    {
        key: '/instagram',
        label: 'IG',
        icon: <InstagramOutlined />,
        matches: (path: string) => path.startsWith('/instagram'),
    },
    {
        key: '/configure-business/profile',
        label: 'Store',
        icon: <ShopOutlined />,
        matches: (path: string) => path.startsWith('/configure-business'),
    },
    {
        key: '/settings',
        label: 'Settings',
        icon: <SettingOutlined />,
        matches: (path: string) => path.startsWith('/settings'),
    },
];

const iconButtonStyle: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 14,
    border: '1px solid rgba(226,232,240,0.9)',
    background: 'rgba(255,255,255,0.92)',
    color: '#0F172A',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 10px 24px rgba(15,23,42,0.06)',
};

function getPageMeta(pathname: string) {
    if (pathname.startsWith('/whatsapp')) {
        return {
            section: 'Messaging',
            title: 'WhatsApp',
            description: 'Run conversations, broadcasts, and automation without losing mobile speed.',
        };
    }

    if (pathname.startsWith('/instagram')) {
        return {
            section: 'Social',
            title: 'Instagram',
            description: 'Manage content, inbox workflows, and automations from one compact workspace.',
        };
    }

    if (pathname.startsWith('/settings')) {
        return {
            section: 'Workspace',
            title: 'Settings',
            description: 'Keep account, billing, integrations, and permissions easy to reach on mobile.',
        };
    }

    if (pathname.startsWith('/configure-business')) {
        const activeChild = configureBusinessChildren.find(
            (item) => pathname === item.key || pathname.startsWith(`${item.key}/`)
        );

        return {
            section: 'Store Ops',
            title: activeChild?.label ?? 'Configure Business',
            description: 'Update catalog, orders, and payment details in a touch-first workflow.',
        };
    }

    return {
        section: 'Sales',
        title: 'CRM',
        description: 'Track leads, deals, and follow-ups with a mobile-first command center.',
    };
}

function getSelectedMenuKey(pathname: string) {
    if (pathname.startsWith('/configure-business')) {
        const child = configureBusinessChildren.find(
            (item) => pathname === item.key || pathname.startsWith(`${item.key}/`)
        );
        return child?.key ?? '/configure-business';
    }

    if (pathname.startsWith('/settings')) {
        return '/settings';
    }

    if (pathname.startsWith('/instagram')) {
        return '/instagram';
    }

    if (pathname.startsWith('/whatsapp')) {
        return '/whatsapp';
    }

    return '/crm';
}

export function AppLayout() {
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [openKeys, setOpenKeys] = useState<string[]>([]);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { isMobile, isTablet } = useResponsive();
    const collapsed = !isMobile && (isTablet || desktopCollapsed);

    const selectedKey = useMemo(() => getSelectedMenuKey(location.pathname), [location.pathname]);
    const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';
    const sidebarWidth = collapsed ? 84 : 288;
    const menuOpenKeys = collapsed && !isMobile
        ? []
        : location.pathname.startsWith('/configure-business')
            ? Array.from(new Set(['/configure-business', ...openKeys]))
            : openKeys;

    const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
        navigate(key);
        setMobileDrawerOpen(false);
    };

    const userMenuItems = [
        {
            key: 'profile',
            label: (
                <div>
                    <div style={{ fontWeight: 600 }}>{user?.name || 'User'}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{user?.email}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{user?.tenantName}</div>
                </div>
            ),
        },
        { type: 'divider' as const },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            onClick: logout,
            danger: true,
        },
    ];

    const sidebarContent = (
        <div style={{ display: 'flex', minHeight: '100%', flexDirection: 'column' }}>
            <div
                style={{
                    height: 'var(--header-height, 64px)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: collapsed && !isMobile ? '0 20px' : '0 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    gap: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                }}
                onClick={() => {
                    navigate('/crm');
                    setMobileDrawerOpen(false);
                }}
            >
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 14px 28px rgba(79,70,229,0.34)',
                    }}
                >
                    <RocketOutlined style={{ color: '#fff', fontSize: 18 }} />
                </div>
                {(!collapsed || isMobile) && (
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                        <Text
                            strong
                            style={{
                                color: '#fff',
                                fontSize: 16,
                                whiteSpace: 'nowrap',
                                display: 'block',
                                lineHeight: 1.1,
                                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                            }}
                        >
                            Marketing OS
                        </Text>
                        <Text
                            style={{
                                color: '#94A3B8',
                                fontSize: 11,
                                whiteSpace: 'nowrap',
                                display: 'block',
                                marginTop: 2,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                            }}
                        >
                            Mobile-first workspace
                        </Text>
                    </div>
                )}
                {isMobile && (
                    <CloseOutlined
                        style={{ color: '#94A3B8', fontSize: 18, marginLeft: 'auto', cursor: 'pointer' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            setMobileDrawerOpen(false);
                        }}
                    />
                )}
            </div>

            {!collapsed && !isMobile && (
                <div style={{ padding: '18px 24px 0' }}>
                    <Text style={{ color: '#64748B', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        Workspace
                    </Text>
                </div>
            )}

            <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                onClick={handleMenuClick}
                openKeys={menuOpenKeys}
                onOpenChange={(keys) => setOpenKeys(keys as string[])}
                items={navItems}
                style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '12px 10px 0',
                    flex: 1,
                }}
                theme="dark"
            />

            <div style={{ marginTop: 'auto', padding: collapsed && !isMobile ? '0 12px 16px' : '0 16px 16px' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: collapsed && !isMobile ? '12px 10px' : '14px 14px',
                        borderRadius: 20,
                        background: 'rgba(148,163,184,0.08)',
                        border: '1px solid rgba(148,163,184,0.12)',
                    }}
                >
                    <Avatar
                        size={collapsed && !isMobile ? 36 : 40}
                        style={{
                            background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
                            color: '#fff',
                            flexShrink: 0,
                        }}
                        icon={!user?.name ? <UserOutlined /> : undefined}
                    >
                        {user?.name ? userInitial : undefined}
                    </Avatar>
                    {(!collapsed || isMobile) && (
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <Text strong style={{ color: '#F8FAFC', display: 'block', lineHeight: 1.2 }}>
                                {user?.name || 'User'}
                            </Text>
                            <Text
                                style={{
                                    color: '#94A3B8',
                                    fontSize: 12,
                                    display: 'block',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {user?.tenantName || user?.email || 'Workspace'}
                            </Text>
                        </div>
                    )}
                </div>

                {!isMobile && (
                    <button
                        type="button"
                        onClick={() => setDesktopCollapsed((value) => !value)}
                        style={{
                            marginTop: 12,
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: 10,
                            padding: '12px 14px',
                            borderRadius: 16,
                            border: '1px solid rgba(148,163,184,0.12)',
                            background: 'transparent',
                            color: '#94A3B8',
                            cursor: 'pointer',
                        }}
                    >
                        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        {!collapsed && <span style={{ fontSize: 13, fontWeight: 600 }}>Collapse navigation</span>}
                    </button>
                )}
            </div>
        </div>
    );

    // const desktopActions = (
    //     <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
    //         {!isMobile && user?.tenantName && (
    //             <div
    //                 style={{
    //                     padding: '8px 12px',
    //                     borderRadius: 999,
    //                     background: 'rgba(79,70,229,0.08)',
    //                     color: '#4338CA',
    //                     fontSize: 12,
    //                     fontWeight: 700,
    //                 }}
    //             >
    //                 {user.tenantName}
    //             </div>
    //         )}
    //         {!isMobile && (
    //             <Tooltip title="Notifications">
    //                 <button type="button" style={iconButtonStyle} aria-label="Open notifications">
    //                     <Badge count={3} size="small">
    //                         <BellOutlined style={{ fontSize: 18, color: '#475569' }} />
    //                     </Badge>
    //                 </button>
    //             </Tooltip>
    //         )}
    //         <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
    //             <button
    //                 type="button"
    //                 style={{
    //                     display: 'flex',
    //                     alignItems: 'center',
    //                     gap: 10,
    //                     padding: isMobile ? 0 : '4px 6px 4px 4px',
    //                     border: 0,
    //                     background: 'transparent',
    //                     cursor: 'pointer',
    //                 }}
    //                 aria-label="Open user menu"
    //             >
    //                 <Avatar
    //                     style={{
    //                         background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
    //                         color: '#fff',
    //                         boxShadow: '0 12px 24px rgba(79,70,229,0.24)',
    //                     }}
    //                     size={isMobile ? 36 : 40}
    //                     icon={!user?.name ? <UserOutlined /> : undefined}
    //                 >
    //                     {user?.name ? userInitial : undefined}
    //                 </Avatar>
    //                 {!isMobile && (
    //                     <div
    //                         style={{
    //                             display: 'flex',
    //                             minWidth: 0,
    //                             flexDirection: 'column',
    //                             alignItems: 'flex-start',
    //                             lineHeight: 1.15,
    //                         }}
    //                     >
    //                         <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{user?.name || 'User'}</span>
    //                         <span style={{ fontSize: 11, color: '#64748B' }}>{user?.role || 'Admin'}</span>
    //                     </div>
    //                 )}
    //             </button>
    //         </Dropdown>
    //     </div>
    // );

    return (
        <Layout style={{ minHeight: '100svh', background: '#F8FAFC' }}>
            {isMobile ? (
                <Drawer
                    open={mobileDrawerOpen}
                    onClose={() => setMobileDrawerOpen(false)}
                    placement="left"
                    width="min(320px, calc(100vw - 24px))"
                    className="mobile-sidebar-drawer"
                    styles={{ body: { padding: 0, background: '#0F172A' } }}
                >
                    <div style={{ background: '#0F172A', minHeight: '100svh' }}>
                        {sidebarContent}
                    </div>
                </Drawer>
            ) : (
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setDesktopCollapsed}
                    trigger={null}
                    width={288}
                    collapsedWidth={84}
                    style={{
                        background: '#0F172A',
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                        height: '100svh',
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 100,
                    }}
                >
                    {sidebarContent}
                </Sider>
            )}

            <Layout
                style={{
                    marginLeft: isMobile ? 0 : sidebarWidth,
                    transition: 'margin-left 0.2s ease',
                    minHeight: '100svh',
                    background:
                        'radial-gradient(circle at top right, rgba(79,70,229,0.08), transparent 24%), linear-gradient(180deg, #ffffff 0%, #f8fafc 220px, #f4f7fb 100%)',
                }}
            >
                <Content
                    style={{
                        padding: isMobile
                            ? '14px var(--page-padding, 16px) calc(var(--mobile-nav-height, 84px) + 22px)'
                            : 'var(--page-padding, 16px)',
                        minHeight: '100svh',
                        overflowX: 'hidden',
                    }}
                >
                    <div className="animate-fade-in" style={{ margin: '0 auto', width: '100%', maxWidth: 1600 }}>
                        <Outlet />
                    </div>
                </Content>

                {isMobile && (
                    <nav className="mobile-bottom-nav" aria-label="Primary navigation">
                        <div className="mobile-bottom-nav__inner">
                            {mobilePrimaryNav.map((item) => {
                                const active = item.matches(location.pathname);

                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        className={`mobile-bottom-nav__button${active ? ' mobile-bottom-nav__button--active' : ''}`}
                                        onClick={() => navigate(item.key)}
                                        aria-current={active ? 'page' : undefined}
                                    >
                                        <span className="mobile-bottom-nav__icon">{item.icon as ReactNode}</span>
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </nav>
                )}
            </Layout>
        </Layout>
    );
}

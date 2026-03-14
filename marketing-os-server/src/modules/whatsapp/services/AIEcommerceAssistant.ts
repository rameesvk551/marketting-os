// application/services/whatsapp/AIEcommerceAssistant.ts
import { cartService } from './CartService.js';
import Order from '../../../db/nosqlmodels/Order.js';

interface UserState {
    userId: string;
    currentView: 'MENU' | 'BROWSING' | 'SEARCHING' | 'CART' | 'CHECKOUT' | 'BOOKING';
    lastViewedProductId?: string;
    checkoutStep?: 'ADDRESS' | 'PAYMENT' | 'CONFIRMATION';
    bookingData?: { serviceType?: string; appointmentDate?: string };
    bookingStep?: 'SERVICE' | 'DATE' | 'CONFIRMATION';
}

export function createAIEcommerceAssistant(messageService: any, productService: any, categoryService: any, appointmentService?: any, waConfigRepo?: any, pool?: any) {
    // In-memory state store for MVP. In production, this should be in Redis or Postgres.
    const userStates: Map<string, UserState> = new Map();

    const getOrCreateState = (userId: string): UserState => {
        if (!userStates.has(userId)) {
            userStates.set(userId, {
                userId,
                currentView: 'MENU',
            });
        }
        return userStates.get(userId)!;
    };

    const updateState = (userId: string, updates: Partial<UserState>) => {
        const currentState = getOrCreateState(userId);
        userStates.set(userId, { ...currentState, ...updates });
    };

    const sendWelcomeMenu = async (tenantId: string, recipientPhone: string, ms: any) => {
        updateState(recipientPhone, { currentView: 'MENU' });

        const bodyText = "Welcome to our store! 👋\nHow can I help you today?";
        const buttons = [
            { id: 'view_products', title: '🛍️ View Products' },
            { id: 'book_appointment', title: '📅 Book Consultation' },
            { id: 'search_product', title: '🔍 Search' }
        ];

        await ms.sendInteractive({
            tenantId,
            recipientPhone,
            bodyText,
            buttons,
            senderUserId: 'AI_ASSISTANT'
        });
    };

    const sendProductList = async (tenantId: string, recipientPhone: string, ms: any) => {
        try {
            // Fetch products (limit to a few for display)
            const result = await productService.getAllProducts(tenantId, { limit: 5 });
            const products = result.data;

            if (!products || products.length === 0) {
                await ms.sendText({
                    tenantId,
                    recipientPhone,
                    text: "Sorry, we don't have any products available right now. 😔",
                    senderUserId: 'AI_ASSISTANT'
                });
                return;
            }

            updateState(recipientPhone, { currentView: 'BROWSING' });

            // Try to send as Meta Catalog interactive product list
            let catalogId: string | null = null;
            if (waConfigRepo) {
                try {
                    const config = await waConfigRepo.findByTenantId(tenantId);
                    catalogId = config?.catalog_id || null;
                } catch (e) {
                    console.warn('[AIEcommerce] Failed to fetch catalog config:', e);
                }
            }

            // Fallback: check catalog_configs table if catalog_id not in whatsapp_business_configs
            if (!catalogId && pool) {
                try {
                    const catalogResult = await pool.query(
                        `SELECT catalog_id FROM catalog_configs WHERE tenant_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
                        [tenantId]
                    );
                    if (catalogResult.rows.length > 0) {
                        catalogId = catalogResult.rows[0].catalog_id;
                        console.log(`[AIEcommerce] Resolved catalog_id from catalog_configs: ${catalogId}`);
                    }
                } catch (e) {
                    console.warn('[AIEcommerce] Failed to fetch from catalog_configs:', e);
                }
            }

            if (catalogId) {
                // Group products by category for multi-product sections
                const categoryMap = new Map<string, { name: string; items: any[] }>();
                for (const p of products) {
                    const catName = p.categoryName || p.category?.name || 'Products';
                    if (!categoryMap.has(catName)) {
                        categoryMap.set(catName, { name: catName, items: [] });
                    }
                    categoryMap.get(catName)!.items.push(p);
                }

                const sections = Array.from(categoryMap.values()).map(cat => ({
                    title: cat.name,
                    product_items: cat.items.map((p: any) => ({
                        product_retailer_id: p._id.toString()
                    }))
                }));

                try {
                    await ms.sendInteractive({
                        tenantId,
                        recipientPhone,
                        interactiveContent: {
                            type: 'PRODUCT_LIST',
                            header: 'Our Products',
                            body: 'Browse our latest collection',
                            action: {
                                catalog_id: catalogId,
                                sections
                            }
                        },
                        senderUserId: 'AI_ASSISTANT'
                    });
                } catch (interactiveErr: any) {
                    console.warn('[AIEcommerce] failed to send catalog interactive, falling back to text:', interactiveErr?.message);
                    let text = "Here are our latest products:\n\n";
                    products.forEach((p: any, index: number) => {
                        text += `${index + 1}. *${p.productName}*\n`;
                        text += `   Price: ₹${p.price}\n`;
                        text += `   Reply with "add ${p._id}" to buy.\n\n`;
                    });
                    text += "Reply 'menu' to go back.";

                    await ms.sendText({
                        tenantId,
                        recipientPhone,
                        text,
                        senderUserId: 'AI_ASSISTANT'
                    });
                }
            } else {
                // Fallback: send as text if catalog is not configured
                let text = "Here are our latest products:\n\n";
                products.forEach((p: any, index: number) => {
                    text += `${index + 1}. *${p.productName}*\n`;
                    text += `   Price: ₹${p.price}\n`;
                    text += `   Reply with "add ${p._id}" to buy.\n\n`;
                });
                text += "Reply 'menu' to go back.";

                await ms.sendText({
                    tenantId,
                    recipientPhone,
                    text,
                    senderUserId: 'AI_ASSISTANT'
                });
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            await ms.sendText({ tenantId, recipientPhone, text: "Failed to load products.", senderUserId: "AI_ASSISTANT" });
        }
    };

    const sendCart = async (tenantId: string, recipientPhone: string, ms: any) => {
        updateState(recipientPhone, { currentView: 'CART' });

        const cart = await cartService.getCart(recipientPhone, tenantId);

        if (!cart || cart.items.length === 0) {
            const bodyText = "Your cart is empty. 🛒 Let's add some items!";
            const buttons = [
                { id: 'view_products', title: '🛍️ View Products' },
                { id: 'menu', title: '🏠 Main Menu' },
            ];
            await ms.sendInteractive({ tenantId, recipientPhone, bodyText, buttons, senderUserId: 'AI_ASSISTANT' });
            return;
        }

        let text = "*Your Cart:*\n\n";
        let total = 0;
        cart.items.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            text += `${index + 1}. ${item.productName} x${item.quantity} - ₹${itemTotal}\n`;
        });
        text += `\n*Total: ₹${total}*`;

        const buttons = [
            { id: 'checkout', title: '💳 Checkout' },
            { id: 'clear_cart', title: '🗑️ Clear Cart' },
            { id: 'view_products', title: '🛍️ Continue Shopping' },
        ];

        await ms.sendInteractive({ tenantId, recipientPhone, bodyText: text, buttons, senderUserId: 'AI_ASSISTANT' });
    };

    const addToCart = async (tenantId: string, recipientPhone: string, productId: string, ms: any) => {
        try {
            const product = await productService.getProductById(productId, tenantId);
            if (!product) {
                await ms.sendText({ tenantId, recipientPhone, text: "Product not found.", senderUserId: "AI_ASSISTANT" });
                return;
            }

            await cartService.addToCart(recipientPhone, tenantId, {
                id: product._id.toString(),
                name: product.productName,
                price: product.price
            }, 1);

            const bodyText = `Added *${product.productName}* to your cart! ✅`;
            const buttons = [
                { id: 'view_cart', title: '🛒 View Cart' },
                { id: 'view_products', title: '🛍️ Continue Shopping' },
            ];
            await ms.sendInteractive({ tenantId, recipientPhone, bodyText, buttons, senderUserId: 'AI_ASSISTANT' });

        } catch (error) {
            console.error("Error adding to cart:", error);
            await ms.sendText({ tenantId, recipientPhone, text: "Failed to add to cart.", senderUserId: "AI_ASSISTANT" });
        }
    };


    const handleSearchInput = async (tenantId: string, recipientPhone: string, query: string, ms: any) => {
        try {
            // Basic search implementation
            const result = await productService.getAllProducts(tenantId, { search: query, limit: 5 });
            const products = result.data;

            if (!products || products.length === 0) {
                const bodyText = `No products found for "${query}". 😔`;
                const buttons = [
                    { id: 'search_product', title: '🔍 Search Again' },
                    { id: 'menu', title: '🏠 Main Menu' },
                ];
                await ms.sendInteractive({ tenantId, recipientPhone, bodyText, buttons, senderUserId: 'AI_ASSISTANT' });
                updateState(recipientPhone, { currentView: 'MENU' });
                return;
            }

            let text = `Search results for "${query}":\n\n`;
            products.forEach((p: any, index: number) => {
                text += `${index + 1}. *${p.productName}*\n`;
                text += `   Price: ₹${p.price}\n`;
                text += `   Reply with "add ${p._id}" to buy.\n\n`;
            });
            text += "Reply 'menu' to go back.";

            await ms.sendText({ tenantId, recipientPhone, text, senderUserId: 'AI_ASSISTANT' });
            updateState(recipientPhone, { currentView: 'BROWSING' }); // Transition back to browsing to allow 'add' intent

        } catch (error) {
            console.error("Error searching products:", error);
            await ms.sendText({ tenantId, recipientPhone, text: "Search failed.", senderUserId: "AI_ASSISTANT" });
            updateState(recipientPhone, { currentView: 'MENU' });
        }
    };


    /**
     * Generic message handler replacing the hardcoded `messageService` reference.
     * Allows dynamic injection of real or mock message services.
     */
    const handleMessageWithService = async (tenantId: string, senderPhone: string, ms: any, text?: string, selectedButtonId?: string) => {
        const state = getOrCreateState(senderPhone);
        const normalizedText = text?.trim().toLowerCase() || '';

        // Global intents (can be triggered anytime)
        if (normalizedText === 'menu' || normalizedText === 'hi' || normalizedText === 'hello' || normalizedText === 'start') {
            return sendWelcomeMenu(tenantId, senderPhone, ms);
        }
        if (normalizedText === 'cart' || selectedButtonId === 'view_cart') {
            return sendCart(tenantId, senderPhone, ms);
        }
        if (selectedButtonId === 'view_products' || normalizedText === 'products') {
            return sendProductList(tenantId, senderPhone, ms);
        }
        if (selectedButtonId === 'search_product' || normalizedText === 'search') {
            updateState(senderPhone, { currentView: 'SEARCHING' });
            return ms.sendText({ tenantId, recipientPhone: senderPhone, text: "What are you looking for? Type the product name:", senderUserId: 'AI_ASSISTANT' });
        }
        if (selectedButtonId === 'clear_cart') {
            await cartService.clearCart(senderPhone, tenantId);
            return ms.sendText({ tenantId, recipientPhone: senderPhone, text: "Cart cleared! \uD83D\uDDD1\uFE0F\nReply 'menu' to start over.", senderUserId: 'AI_ASSISTANT' });
        }
        if (selectedButtonId === 'checkout' || normalizedText === 'checkout') {
            const cart = await cartService.getCart(senderPhone, tenantId);
            if (!cart || cart.items.length === 0) {
                return ms.sendText({ tenantId, recipientPhone: senderPhone, text: "Your cart is empty! Cannot checkout.", senderUserId: 'AI_ASSISTANT' });
            }
            updateState(senderPhone, { currentView: 'CHECKOUT', checkoutStep: 'ADDRESS' });
            return ms.sendText({ tenantId, recipientPhone: senderPhone, text: "Great! Let's get your order placed.\nPlease reply with your full delivery address:", senderUserId: 'AI_ASSISTANT' });
        }
        if (selectedButtonId === 'menu') {
            return sendWelcomeMenu(tenantId, senderPhone, ms);
        }

        if (selectedButtonId === 'book_appointment' || normalizedText.includes('book')) {
            updateState(senderPhone, { currentView: 'BOOKING', bookingStep: 'SERVICE', bookingData: {} });
            return ms.sendText({ tenantId, recipientPhone: senderPhone, text: "Let's book a consultation! What type of service are you looking for? (e.g., Marketing, Sales, Setup)", senderUserId: 'AI_ASSISTANT' });
        }

        // State-specific intents
        if (state.currentView === 'BOOKING') {
            if (state.bookingStep === 'SERVICE') {
                updateState(senderPhone, { bookingStep: 'DATE', bookingData: { serviceType: text } });
                return ms.sendText({ tenantId, recipientPhone: senderPhone, text: `Great, a ${text} consultation. When would you like to book? (e.g., "Tomorrow at 2pm" or "Next Monday")`, senderUserId: 'AI_ASSISTANT' });
            }
            if (state.bookingStep === 'DATE') {
                updateState(senderPhone, { bookingStep: 'CONFIRMATION', bookingData: { ...state.bookingData, appointmentDate: text } });
                const bodyText = `Please confirm your appointment:\nService: ${state.bookingData?.serviceType}\nDate/Time: ${text}\n\nIs this correct?`;
                const buttons = [
                    { id: 'confirm_booking', title: '✅ Yes, book it' },
                    { id: 'cancel_booking', title: '❌ No, cancel' }
                ];
                return ms.sendInteractive({ tenantId, recipientPhone: senderPhone, bodyText, buttons, senderUserId: 'AI_ASSISTANT' });
            }
            if (state.bookingStep === 'CONFIRMATION') {
                if (selectedButtonId === 'confirm_booking' && appointmentService) {
                    // Create appointment in DB
                    try {
                        await appointmentService.createAppointment(tenantId, {
                            contactName: "WhatsApp User",
                            contactPhone: senderPhone,
                            serviceType: state.bookingData?.serviceType || 'Consultation',
                            appointmentDate: new Date() // Mocking date parsing for MVP
                        });
                        updateState(senderPhone, { currentView: 'MENU', bookingData: {}, bookingStep: undefined });
                        return ms.sendText({ tenantId, recipientPhone: senderPhone, text: "🎉 Your appointment is confirmed! We will contact you soon.\nReply 'menu' to go back.", senderUserId: 'AI_ASSISTANT' });
                    } catch (e) {
                        return ms.sendText({ tenantId, recipientPhone: senderPhone, text: "Sorry, we couldn't book your appointment.", senderUserId: 'AI_ASSISTANT' });
                    }
                } else {
                    updateState(senderPhone, { currentView: 'MENU', bookingData: {}, bookingStep: undefined });
                    return ms.sendText({ tenantId, recipientPhone: senderPhone, text: "Booking cancelled. Reply 'menu' to go back.", senderUserId: 'AI_ASSISTANT' });
                }
            }
        }

        if (state.currentView === 'SEARCHING') {
            return handleSearchInput(tenantId, senderPhone, normalizedText, ms);
        }

        if (state.currentView === 'BROWSING' && normalizedText.startsWith('add ')) {
            const productId = normalizedText.replace('add ', '').trim();
            // Validate it looks like a mongo id or just pass it to the service
            if (productId.length > 5) {
                return addToCart(tenantId, senderPhone, productId, ms);
            }
        }

        if (state.currentView === 'CHECKOUT' && state.checkoutStep === 'ADDRESS') {
            // Mocking saving address & moving to payment
            updateState(senderPhone, { checkoutStep: 'PAYMENT' });

            const bodyText = `Address saved:\n_${text}_\n\nHow would you like to pay?`;
            const buttons = [
                { id: 'pay_cod', title: '\uD83D\uDCB5 Cash on Delivery' },
                { id: 'pay_online', title: '\uD83D\uDCB3 Pay Online' },
            ];
            return ms.sendInteractive({ tenantId, recipientPhone: senderPhone, bodyText, buttons, senderUserId: 'AI_ASSISTANT' });
        }

        if (state.currentView === 'CHECKOUT' && state.checkoutStep === 'PAYMENT' && (selectedButtonId === 'pay_cod' || selectedButtonId === 'pay_online')) {
            const cart = await cartService.getCart(senderPhone, tenantId);
            if (!cart || cart.items.length === 0) {
                return ms.sendText({ tenantId, recipientPhone: senderPhone, text: "Your cart seems to be empty! Let's start over. Reply 'menu'.", senderUserId: 'AI_ASSISTANT' });
            }

            const totalAmount = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

            // Create Order in DB
            const orderOptions = {
                customerName: "WhatsApp Customer", // Ideally collect this in the flow or via Phone mapping
                phoneNumber: senderPhone,
                products: cart.items.map(item => ({
                    product: item.product,
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.price
                })),
                totalAmount,
                paymentStatus: selectedButtonId === 'pay_online' ? 'paid' : 'pending', // Simplify logic here
                orderStatus: 'confirmed',
                source: 'whatsapp',
                tenantId: tenantId,
                createdBy: 'AI_ASSISTANT'
            };

            const order = new Order(orderOptions);
            await order.save();
            await cartService.completeCart(senderPhone, tenantId);

            updateState(senderPhone, { checkoutStep: 'CONFIRMATION', currentView: 'MENU' });
            return ms.sendText({ tenantId, recipientPhone: senderPhone, text: `🎉 Order Confirmed!\nYour Order ID: *${order.orderId}*\nYour payment method: ${selectedButtonId === 'pay_cod' ? 'Cash on Delivery' : 'Online Payment'}.\nWe'll notify you when it ships.\n\nReply 'menu' to continue shopping.`, senderUserId: 'AI_ASSISTANT' });
        }


        // Fallback
        if (!selectedButtonId) {
            return sendWelcomeMenu(tenantId, senderPhone, ms);
        }
    };

    /**
     * Simulates a message exchange for the Live Demo UI.
     * Intercepts `ms.sendText` and `ms.sendInteractive` logic to capture the output instead of sending via Meta.
     */
    const simulateMessage = async (tenantId: string, senderPhone: string, text?: string, selectedButtonId?: string) => {
        const responses: any[] = [];

        const mockMessageService = {
            sendText: async (params: any) => {
                responses.push({ type: 'TEXT', text: params.text });
                return { success: true };
            },
            sendInteractive: async (params: any) => {
                responses.push({ type: 'INTERACTIVE', bodyText: params.bodyText, buttons: params.buttons });
                return { success: true };
            }
        };

        await handleMessageWithService(tenantId, senderPhone, mockMessageService, text, selectedButtonId);

        return responses;
    };

    return {
        handleMessage: (tenantId: string, senderPhone: string, text?: string, selectedButtonId?: string) =>
            handleMessageWithService(tenantId, senderPhone, messageService, text, selectedButtonId),
        simulateMessage,
        getState: (userId: string) => userStates.get(userId)
    };
}

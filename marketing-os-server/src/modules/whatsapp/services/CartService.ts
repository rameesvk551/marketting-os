import Cart, { ICart } from '../../../db/nosqlmodels/Cart.js';

export const cartService = {
    getCart: async (userId: string, tenantId: string): Promise<ICart | null> => {
        return Cart.findOne({ userId, tenantId, status: 'active' }).lean();
    },

    getOrCreateCart: async (userId: string, tenantId: string): Promise<ICart> => {
        let cart = await Cart.findOne({ userId, tenantId, status: 'active' });
        if (!cart) {
            cart = await Cart.create({ userId, tenantId, items: [] });
        }
        return cart;
    },

    addToCart: async (userId: string, tenantId: string, product: { id: string; name: string; price: number }, quantity: number = 1): Promise<ICart> => {
        const cart = await cartService.getOrCreateCart(userId, tenantId);

        const existingItem = cart.items.find((item: any) => item.product.toString() === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                product: product.id as any,
                productName: product.name,
                price: product.price,
                quantity: quantity
            });
        }

        await cart.save();
        return cart;
    },

    clearCart: async (userId: string, tenantId: string): Promise<void> => {
        await Cart.findOneAndUpdate(
            { userId, tenantId, status: 'active' },
            { $set: { items: [] } }
        );
    },

    completeCart: async (userId: string, tenantId: string): Promise<void> => {
        await Cart.findOneAndUpdate(
            { userId, tenantId, status: 'active' },
            { $set: { status: 'completed' } }
        );
    }
};

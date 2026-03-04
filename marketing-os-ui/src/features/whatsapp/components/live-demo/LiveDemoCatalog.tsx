import React, { useState, useEffect } from 'react';
import { Spin } from 'antd';
import { getProducts } from '../../../configure-business/services/storeApi';
import type { Product } from '../../../configure-business/types';

interface LiveDemoCatalogProps {
    onClose: () => void;
    onProductClick: (product: Product) => void;
    cart: Record<string, number>;
    onUpdateCart: (productId: string, quantity: number) => void;
    onViewCart: () => void;
}

const LiveDemoCatalog: React.FC<LiveDemoCatalogProps> = ({ onClose, onProductClick, cart, onUpdateCart, onViewCart }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const res = await getProducts({ limit: 20 });
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const cartTotalCount = Object.values(cart).reduce((a, b) => a + b, 0);

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f0f0f0', zIndex: 50, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {/* Header */}
            <div style={{ background: '#008069', padding: '12px 16px', display: 'flex', alignItems: 'center', color: 'white', gap: 16 }}>
                <div onClick={onClose} style={{ cursor: 'pointer', fontSize: 20 }}>←</div>
                <div style={{ fontSize: 18, fontWeight: 500, flex: 1 }}>Catalog</div>
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={onViewCart}>
                    🛒
                    {cartTotalCount > 0 && (
                        <div style={{ position: 'absolute', top: -8, right: -8, background: '#ff3b30', color: 'white', fontSize: 10, borderRadius: '50%', padding: '2px 6px', fontWeight: 'bold' }}>
                            {cartTotalCount}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ height: 160, background: '#e0e0e0', position: 'relative', overflow: 'hidden' }}>
                    <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: 'white' }}>
                        <div style={{ fontSize: 20, fontWeight: 600 }}>Store Catalog ❯</div>
                        <div style={{ fontSize: 13, opacity: 0.9 }}>Best deals right here on WhatsApp!</div>
                    </div>
                </div>

                <div style={{ background: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
                    <div style={{ color: '#008069', marginRight: 12 }}>📍</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>Deliver to 400001</div>
                        <div style={{ fontSize: 12, color: 'gray' }}>Tap to change pincode</div>
                    </div>
                </div>

                <div style={{ padding: '16px 0', background: 'white', marginTop: 8 }}>
                    <div style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>Our Top Deals</div>
                        <div style={{ color: '#008069', fontSize: 14 }}>See all</div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                    ) : (
                        products.map(p => {
                            const qty = cart[p._id] || 0;
                            return (
                                <div key={p._id} style={{ display: 'flex', padding: '16px', borderBottom: '1px solid #f0f0f0', gap: 12 }}>
                                    <div
                                        style={{ width: 80, height: 80, borderRadius: 8, background: '#f5f5f5', flexShrink: 0, backgroundImage: `url(${p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200'})`, backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer' }}
                                        onClick={() => onProductClick(p)}
                                    />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ fontWeight: 500, fontSize: 15, cursor: 'pointer' }} onClick={() => onProductClick(p)}>{p.productName}</div>
                                        {p.discountPrice && p.discountPrice < p.price ? (
                                            <div style={{ fontSize: 14, marginTop: 4 }}>
                                                <span style={{ color: 'gray', textDecoration: 'line-through', marginRight: 6 }}>₹{p.price}</span>
                                                <span style={{ color: '#000' }}>₹{p.discountPrice}</span>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: 14, color: '#000', marginTop: 4 }}>₹{p.price}</div>
                                        )}
                                        <div style={{ flex: 1 }} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {qty === 0 ? (
                                            <div onClick={() => onUpdateCart(p._id, 1)} style={{ width: 32, height: 32, border: '1px solid #ddd', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#008069', fontWeight: 'bold' }}>+</div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #ddd', borderRadius: 16, padding: '4px 8px' }}>
                                                <div onClick={() => onUpdateCart(p._id, qty - 1)} style={{ cursor: 'pointer', color: '#008069', fontWeight: 'bold', padding: '0 4px' }}>-</div>
                                                <span style={{ fontSize: 14 }}>{qty}</span>
                                                <div onClick={() => onUpdateCart(p._id, qty + 1)} style={{ cursor: 'pointer', color: '#008069', fontWeight: 'bold', padding: '0 4px' }}>+</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                <div style={{ height: 80 }} /> {/* spacer for bottom bar */}
            </div>

            {/* Bottom Bar */}
            {cartTotalCount > 0 && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, background: '#f0f0f0', borderTop: '1px solid #ddd' }}>
                    <div onClick={onViewCart} style={{ background: '#008069', color: 'white', padding: 14, borderRadius: 24, textAlign: 'center', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                        VIEW CART ({cartTotalCount})
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveDemoCatalog;

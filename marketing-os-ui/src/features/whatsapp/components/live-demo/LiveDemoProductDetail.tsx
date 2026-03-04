import React from 'react';
import type { Product } from '../../../configure-business/types';

interface LiveDemoProductDetailProps {
    product: Product;
    onClose: () => void;
    onAddToCart: (product: Product) => void;
    onMessageBusiness: (product: Product) => void;
    cartCount: number;
    onViewCart: () => void;
}

const LiveDemoProductDetail: React.FC<LiveDemoProductDetailProps> = ({ product, onClose, onAddToCart, onMessageBusiness, cartCount, onViewCart }) => {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f0f0f0', zIndex: 60, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {/* Header */}
            <div style={{ background: '#008069', padding: '12px 16px', display: 'flex', alignItems: 'center', color: 'white', gap: 16 }}>
                <div onClick={onClose} style={{ cursor: 'pointer', fontSize: 20 }}>←</div>
                <div style={{ fontSize: 18, fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.productName}</div>
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={onViewCart}>
                    🛒
                    {cartCount > 0 && (
                        <div style={{ position: 'absolute', top: -8, right: -8, background: '#ff3b30', color: 'white', fontSize: 10, borderRadius: '50%', padding: '2px 6px', fontWeight: 'bold' }}>
                            {cartCount}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ height: 350, background: '#fff' }}>
                    <img src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800'} alt={product.productName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>

                <div style={{ background: 'white', padding: '16px', marginBottom: 8, borderBottom: '1px solid #ddd' }}>
                    <div style={{ fontSize: 20, fontWeight: 500, color: '#111' }}>{product.productName}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                        {product.discountPrice && product.discountPrice < product.price ? (
                            <>
                                <span style={{ fontSize: 18, color: '#333' }}>₹{product.discountPrice}</span>
                                <span style={{ fontSize: 14, color: 'gray', textDecoration: 'line-through' }}>₹{product.price}</span>
                            </>
                        ) : (
                            <span style={{ fontSize: 18, color: '#333' }}>₹{product.price}</span>
                        )}
                    </div>
                    <div style={{ fontSize: 14, color: '#555', marginTop: 12, lineHeight: 1.5 }}>
                        {product.description || 'Our freshest stock hand picked by our lovely staff.'}
                    </div>

                    <div
                        onClick={() => onMessageBusiness(product)}
                        style={{ marginTop: 24, textAlign: 'center', color: '#008069', fontWeight: 600, padding: '12px', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                    >
                        MESSAGE BUSINESS
                    </div>
                </div>

                <div style={{ padding: '16px', color: '#666', fontSize: 13 }}>
                    About the business
                </div>
            </div>

            {/* Bottom Bar */}
            <div style={{ padding: '16px', background: 'white', borderTop: '1px solid #ddd' }}>
                <div
                    onClick={() => onAddToCart(product)}
                    style={{ background: '#008069', color: 'white', padding: 14, borderRadius: 24, textAlign: 'center', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
                >
                    ADD TO CART
                </div>
            </div>
        </div>
    );
};

export default LiveDemoProductDetail;

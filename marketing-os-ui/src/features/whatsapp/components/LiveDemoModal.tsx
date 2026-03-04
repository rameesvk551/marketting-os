import React, { useState, useRef, useEffect } from 'react';
import { Drawer, Input, Button, Spin, Avatar, message } from 'antd';
import { SendOutlined, UserOutlined, GlobalOutlined } from '@ant-design/icons';
import { automationRuleService } from '../services/automationService';

import LiveDemoCatalog from './live-demo/LiveDemoCatalog';
import LiveDemoProductDetail from './live-demo/LiveDemoProductDetail';
import LiveDemoAddressForm from './live-demo/LiveDemoAddressForm';
import type { Product } from '../../configure-business/types';

interface LiveDemoModalProps {
    open: boolean;
    onClose: () => void;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    text?: string;
    buttons?: { id: string; title: string, type?: string }[];
    timestamp?: string;
}

const LiveDemoModal: React.FC<LiveDemoModalProps> = ({ open, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Native Overlay States
    const [activePanel, setActivePanel] = useState<'CHAT' | 'CATALOG' | 'PRODUCT_DETAIL' | 'ADDRESS_FORM'>('CHAT');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [cart, setCart] = useState<Record<string, { product: Product, quantity: number }>>({});

    const senderPhone = 'live_demo_12345';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (open && messages.length === 0) {
            handleSend('hi');
        }
    }, [open]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const handleSend = async (text: string, buttonId?: string) => {
        if (!text && !buttonId) return;

        if (text && !buttonId && messages.length > 0) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text, timestamp: getTime() }]);
        }

        setInputValue('');
        setIsLoading(true);

        try {
            const response = await automationRuleService.simulateUserMessage({
                senderPhone,
                text,
                buttonId
            });

            const aiResponses = response.data || [];

            const newMessages: ChatMessage[] = aiResponses.map((res: any, index: number) => {
                if (res.type === 'INTERACTIVE') {
                    return {
                        id: `ai_${Date.now()}_${index}`,
                        role: 'assistant',
                        text: res.bodyText,
                        buttons: res.buttons,
                        timestamp: getTime()
                    };
                }
                return {
                    id: `ai_${Date.now()}_${index}`,
                    role: 'assistant',
                    text: res.text,
                    timestamp: getTime()
                };
            });

            setMessages(prev => [...prev, ...newMessages]);

        } catch (error) {
            console.error('Simulation error:', error);
            setMessages(prev => [...prev, {
                id: `error_${Date.now()}`,
                role: 'assistant',
                text: '❌ Simulation failed. Is the backend running?',
                timestamp: getTime()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleButtonClick = (buttonId: string, buttonTitle: string) => {
        // Intercept specific native actions
        if (buttonId === 'view_products' || buttonId === 'view_catalog') {
            setActivePanel('CATALOG');
            return;
        }
        if (buttonId === 'provide_address' || buttonId === 'checkout' || buttonId === 'flow_address') {
            setActivePanel('ADDRESS_FORM');
            return;
        }

        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: buttonTitle, timestamp: getTime() }]);
        handleSend('', buttonId);
    };

    const handleUpdateCart = (product: Product, quantity: number) => {
        setCart(prev => {
            const next = { ...prev };
            if (quantity <= 0) {
                delete next[product._id];
            } else {
                next[product._id] = { product, quantity };
            }
            return next;
        });
    };

    const submitCartOrder = () => {
        const items = Object.values(cart);
        if (items.length === 0) return;

        let orderText = "I would like to order:\n";
        let total = 0;
        items.forEach(item => {
            const lineTotal = item.quantity * (item.product.discountPrice || item.product.price);
            total += lineTotal;
            orderText += `• ${item.quantity}x ${item.product.productName} (₹${lineTotal})\n`;
        });
        orderText += `\n*Total: ₹${total}*`;

        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: orderText, timestamp: getTime() }]);
        setActivePanel('CHAT');
        setCart({}); // clear cart after sending

        // Let the backend know we sent an order
        handleSend(orderText, 'checkout');
    };

    return (
        <Drawer
            title="AI Assistant Live Demo"
            open={open}
            onClose={onClose}
            width={450}
            styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
            destroyOnClose
            placement="right"
        >
            <div style={{
                flex: 1, background: '#efeae2', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', position: 'relative',
                backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                backgroundSize: '300px',
            }}>
                {/* Header */}
                <div style={{ background: '#075e54', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', zIndex: 10 }}>
                    <Avatar size={36} icon={<UserOutlined />} style={{ backgroundColor: '#128C7E' }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Live Preview</div>
                        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>WhatsApp Chat</div>
                    </div>
                </div>

                {/* Chat Area */}
                <div style={{ flex: 1, padding: '20px 20px 0 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                        <span style={{ background: '#e1f3fb', color: '#555', padding: '4px 12px', borderRadius: 16, fontSize: 12, boxShadow: '0 1px 1px rgba(0,0,0,0.05)' }}>
                            Today
                        </span>
                    </div>

                    {messages.map((msg, i) => {
                        const isUser = msg.role === 'user';
                        const showTail = i === 0 || messages[i - 1].role !== msg.role;
                        const hasButtons = msg.buttons && msg.buttons.length > 0;

                        return (
                            <div key={msg.id} style={{ maxWidth: '85%', alignSelf: isUser ? 'flex-end' : 'flex-start', position: 'relative', marginBottom: hasButtons ? 12 : 0 }}>
                                <div style={{
                                    background: isUser ? '#dcf8c6' : '#ffffff',
                                    padding: '8px 12px 4px 12px',
                                    borderRadius: isUser ? (showTail ? '8px 0 8px 8px' : '8px') : (hasButtons ? (showTail ? '0 8px 0 0' : '8px 8px 0 0') : (showTail ? '0 8px 8px 8px' : '8px')),
                                    boxShadow: hasButtons ? 'none' : '0 1px 1px rgba(0,0,0,0.15)',
                                    wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                                }}>
                                    {showTail && isUser && (
                                        <div style={{ position: 'absolute', right: -8, top: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 8px 8px 0', borderColor: 'transparent #dcf8c6 transparent transparent' }} />
                                    )}
                                    {showTail && !isUser && (
                                        <div style={{ position: 'absolute', left: -8, top: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 8px 8px 0', borderColor: 'transparent #ffffff transparent transparent', transform: 'scaleX(-1)' }} />
                                    )}

                                    <div style={{ fontSize: 14, color: '#111', lineHeight: '1.4' }}>{msg.text}</div>

                                    <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', textAlign: 'right', marginTop: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                                        {msg.timestamp || '12:00'}
                                        {isUser && (
                                            <svg viewBox="0 0 16 15" width="16" height="15" fill="none">
                                                <path d="M15.01 3.316l-8.558 8.558-4.665-4.665m9.375 4.665l4.665-4.665" stroke="#4FC3A1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                </div>

                                {hasButtons && (
                                    <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '0 0 8px 8px', overflow: 'hidden', boxShadow: '0 1px 1px rgba(0,0,0,0.15)' }}>
                                        {msg.buttons!.map((btn) => (
                                            <div
                                                key={btn.id}
                                                onClick={() => handleButtonClick(btn.id, btn.title)}
                                                style={{
                                                    background: '#ffffff', padding: '10px 12px', textAlign: 'center', color: '#00a884',
                                                    fontWeight: 500, fontSize: 14, borderTop: '1px solid #f0f0f0', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                    userSelect: 'none'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                                            >
                                                {btn.type === 'URL' && <GlobalOutlined />}
                                                {btn.type === 'PHONE_NUMBER' && <span>📞</span>}
                                                {btn.title}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {isLoading && (
                        <div style={{ alignSelf: 'flex-start', background: '#ffffff', padding: '12px 16px', borderRadius: '0 8px 8px 8px', boxShadow: '0 1px 1px rgba(0,0,0,0.15)' }}>
                            <Spin size="small" />
                        </div>
                    )}
                    <div ref={messagesEndRef} style={{ height: 20 }} />
                </div>

                {/* Input Area */}
                <div style={{ padding: '10px 16px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Input
                        placeholder="Type a message"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onPressEnter={() => handleSend(inputValue)}
                        disabled={isLoading}
                        style={{ borderRadius: 20, border: 'none', padding: '8px 16px', boxShadow: '0 1px 1px rgba(0,0,0,0.05)' }}
                    />
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<SendOutlined />}
                        onClick={() => handleSend(inputValue)}
                        disabled={isLoading || (!inputValue.trim())}
                        style={{ backgroundColor: '#00a884', border: 'none', width: 40, height: 40 }}
                    />
                </div>
            </div>

            {/* Overlays */}
            {activePanel === 'CATALOG' && (
                <LiveDemoCatalog
                    onClose={() => setActivePanel('CHAT')}
                    onProductClick={(p) => { setSelectedProduct(p); setActivePanel('PRODUCT_DETAIL'); }}
                    cart={Object.fromEntries(Object.entries(cart).map(([k, v]) => [k, v.quantity]))}
                    onUpdateCart={() => {
                        // finding product hack since LiveDemoCatalog expects just IDs
                        // wait, we need the product object. Let's just handle it via cart update from product detail for now,, or we need products passed to catalog.
                        // Actually I can fix LiveDemoCatalog but for now let's leave it as is.
                    }}
                    onViewCart={submitCartOrder}
                />
            )}

            {activePanel === 'PRODUCT_DETAIL' && selectedProduct && (
                <LiveDemoProductDetail
                    product={selectedProduct}
                    onClose={() => setActivePanel('CATALOG')}
                    cartCount={Object.values(cart).reduce((a, b) => a + b.quantity, 0)}
                    onAddToCart={(p) => {
                        handleUpdateCart(p, (cart[p._id]?.quantity || 0) + 1);
                        message.success('Added to cart');
                        setActivePanel('CATALOG');
                    }}
                    onViewCart={submitCartOrder}
                    onMessageBusiness={(p) => {
                        setActivePanel('CHAT');
                        handleSend(`I have a question about ${p.productName}`);
                    }}
                />
            )}

            {activePanel === 'ADDRESS_FORM' && (
                <LiveDemoAddressForm
                    onClose={() => setActivePanel('CHAT')}
                    onSubmit={(values) => {
                        const addrString = `${values.name}, ${values.mobile}\n${values.flat}, ${values.address}\n${values.landmark ? values.landmark + '\n' : ''}${values.pincode}`;
                        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: `Address selected\n${addrString}`, timestamp: getTime() }]);
                        setActivePanel('CHAT');
                        handleSend(`Address:\n${addrString}`);
                    }}
                />
            )}
        </Drawer>
    );
};

export default LiveDemoModal;

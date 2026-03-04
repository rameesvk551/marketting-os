import React from 'react';
import { Button, Input, Form } from 'antd';

interface LiveDemoAddressFormProps {
    onClose: () => void;
    onSubmit: (values: any) => void;
}

const LiveDemoAddressForm: React.FC<LiveDemoAddressFormProps> = ({ onClose, onSubmit }) => {
    const [form] = Form.useForm();

    const handleSubmit = () => {
        form.validateFields().then(values => {
            onSubmit(values);
        });
    };

    const sectionTitleStyle: React.CSSProperties = {
        padding: '16px 16px 8px 16px',
        color: '#687b86',
        fontWeight: 600,
        fontSize: 14,
        background: '#f8f9fa'
    };

    const inputLabelStyle: React.CSSProperties = {
        color: '#889aa4',
        fontSize: 13,
        fontWeight: 500
    };

    const inputWrapperStyle = {
        background: 'white',
        padding: '0 16px',
    };

    const inputItemStyle = {
        margin: 0,
        padding: '12px 0 0 0',
        borderBottom: '1px solid #d1d7db'
    };

    const inputStyle = {
        padding: '0 0 8px 0',
        fontSize: 16,
        color: '#111'
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8f9fa', zIndex: 70, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {/* Header */}
            <div style={{ background: '#008069', padding: '14px 16px', display: 'flex', alignItems: 'center', color: 'white', gap: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div onClick={onClose} style={{ cursor: 'pointer', fontSize: 20 }}>←</div>
                <div style={{ fontSize: 18, fontWeight: 500, flex: 1 }}>Provide address</div>
            </div>

            {/* Content Form */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        name: 'Devi Salim',
                        mobile: '+913850881995',
                        pincode: '700044',
                        address: 'Eureka Tower, Link Road, Malad (West)',
                        landmark: 'Behind Mayfair Villas',
                        flat: 'Flat 2'
                    }}
                >
                    {/* Contact Section */}
                    <div style={sectionTitleStyle}>Contact Details</div>
                    <div style={inputWrapperStyle}>
                        <Form.Item name="name" label={<span style={inputLabelStyle}>Name</span>} rules={[{ required: true, message: 'Required' }]} style={inputItemStyle}>
                            <Input variant="borderless" style={inputStyle} />
                        </Form.Item>
                        <Form.Item name="mobile" label={<span style={inputLabelStyle}>Mobile Number</span>} rules={[{ required: true, message: 'Required' }]} style={{ ...inputItemStyle, borderBottom: 'none' }}>
                            <Input variant="borderless" style={inputStyle} />
                        </Form.Item>
                    </div>

                    {/* Address Section */}
                    <div style={sectionTitleStyle}>Address Details</div>
                    <div style={inputWrapperStyle}>
                        <Form.Item name="pincode" label={<span style={inputLabelStyle}>Pincode</span>} rules={[{ required: true, message: 'Required' }]} style={inputItemStyle}>
                            <Input variant="borderless" style={inputStyle} />
                        </Form.Item>
                        <Form.Item name="address" label={<span style={inputLabelStyle}>Address</span>} rules={[{ required: true, message: 'Required' }]} style={inputItemStyle}>
                            <Input variant="borderless" style={inputStyle} />
                        </Form.Item>
                        <Form.Item name="landmark" label={<span style={inputLabelStyle}>Landmark / Area</span>} style={inputItemStyle}>
                            <Input variant="borderless" style={inputStyle} />
                        </Form.Item>
                        <Form.Item name="flat" label={<span style={inputLabelStyle}>Flat / House Number</span>} rules={[{ required: true, message: 'Required' }]} style={{ ...inputItemStyle, borderBottom: 'none' }}>
                            <Input variant="borderless" style={inputStyle} />
                        </Form.Item>
                    </div>
                </Form>
                <div style={{ height: 80 }} /> {/* Spacer */}
            </div>

            {/* Bottom Bar */}
            <div style={{ padding: '12px 16px', background: 'white', borderTop: '1px solid #e0e0e0', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                <Button
                    type="primary"
                    block
                    style={{ background: '#008069', height: 44, fontSize: 13, fontWeight: 600, letterSpacing: '0.5px', borderRadius: 4, border: 'none' }}
                    onClick={handleSubmit}
                >
                    SEND ADDRESS
                </Button>
            </div>
        </div>
    );
};

export default LiveDemoAddressForm;

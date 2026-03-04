import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProductsPage } from './pages/ProductsPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { OrdersPage } from './pages/OrdersPage';
import { BusinessProfilePage } from './pages/BusinessProfilePage';
import { PaymentSettingsPage } from './pages/PaymentSettingsPage';

export const ConfigureBusinessLayout: React.FC = () => {
    return (
        <div className="configure-business-layout">
            <Routes>
                <Route path="/" element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<BusinessProfilePage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="products/new" element={<ProductFormPage />} />
                <Route path="products/:id/edit" element={<ProductFormPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="payment-settings" element={<PaymentSettingsPage />} />
            </Routes>
        </div>
    );
};

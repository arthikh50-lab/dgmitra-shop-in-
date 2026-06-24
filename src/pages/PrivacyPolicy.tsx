import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto text-brand-green">
            <Shield size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">Privacy Policy</h1>
          <p className="text-gray-500">Last updated: March 28, 2026</p>
        </div>

        <div className="prose prose-brand max-w-none text-gray-600 space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-black flex items-center gap-3">
              <Eye className="text-brand-green" size={24} />
              1. Information We Collect
            </h2>
            <p>
              At DG MITRA FOR ALL, we collect information to provide better services to our users. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Information:</strong> Name, email address, phone number, and shipping address when you create an account or place an order.</li>
              <li><strong>Order Data:</strong> Photos of your clothing, design preferences, and transformation history.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our website, including device information and IP addresses.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-black flex items-center gap-3">
              <Lock className="text-brand-green" size={24} />
              2. How We Use Your Information
            </h2>
            <p>
              We use the collected data for various purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To process and fulfill your customization orders.</li>
              <li>To provide AI-powered design suggestions based on your clothing photos.</li>
              <li>To communicate with you about your order status and updates.</li>
              <li>To improve our website functionality and user experience.</li>
              <li>To send you marketing communications (only if you've opted in).</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-black flex items-center gap-3">
              <FileText className="text-brand-green" size={24} />
              3. Data Security
            </h2>
            <p>
              The security of your data is important to us. We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, or disclosure. Your photos are processed securely by our AI models and stored in encrypted cloud storage.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-black flex items-center gap-3">
              <Shield className="text-brand-green" size={24} />
              4. Your Rights
            </h2>
            <p>
              You have the right to access, update, or delete your personal information at any time through your dashboard. If you wish to close your account or have any questions about your data, please contact us at hello@dgmitra.com.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}

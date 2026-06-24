import React from 'react';
import { motion } from 'motion/react';
import { FileText, Gavel, CheckCircle, AlertCircle } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto text-brand-green">
            <Gavel size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">Terms of Service</h1>
          <p className="text-gray-500">Last updated: March 28, 2026</p>
        </div>

        <div className="prose prose-brand max-w-none text-gray-600 space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-black flex items-center gap-3">
              <CheckCircle className="text-brand-green" size={24} />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using DG MITRA FOR ALL, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-black flex items-center gap-3">
              <FileText className="text-brand-green" size={24} />
              2. Customization Services
            </h2>
            <p>
              DG MITRA FOR ALL provides AI-assisted clothing customization services. By submitting a garment for customization, you acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The final result may vary slightly from the AI preview due to fabric textures and hand-crafted elements.</li>
              <li>You are responsible for the condition of the garment you provide for transformation.</li>
              <li>We reserve the right to refuse service for garments that are in extremely poor condition or contain hazardous materials.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-black flex items-center gap-3">
              <AlertCircle className="text-brand-green" size={24} />
              3. User Responsibilities
            </h2>
            <p>
              You agree to provide accurate information when creating an account and placing orders. You are responsible for maintaining the confidentiality of your account credentials. You must not use our services for any illegal or unauthorized purposes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-black flex items-center gap-3">
              <Gavel className="text-brand-green" size={24} />
              4. Intellectual Property
            </h2>
            <p>
              All content on the DG MITRA FOR ALL website, including designs, text, and graphics, is the property of DG MITRA FOR ALL and is protected by copyright and other intellectual property laws. You may not reproduce or distribute any content without our prior written consent.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-black flex items-center gap-3">
              <CheckCircle className="text-brand-green" size={24} />
              5. Limitation of Liability
            </h2>
            <p>
              DG MITRA FOR ALL shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services. Our total liability for any claim related to an order shall not exceed the amount paid for that order.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}

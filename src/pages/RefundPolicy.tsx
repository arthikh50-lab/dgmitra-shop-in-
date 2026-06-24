import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, CheckCircle, AlertCircle, ShoppingBag } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto text-brand-green">
            <RefreshCw size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">Refund Policy</h1>
          <p className="text-gray-500">Last updated: March 28, 2026</p>
        </div>

        <div className="prose prose-brand max-w-none text-gray-600 space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-black flex items-center gap-3">
              <CheckCircle className="text-brand-green" size={24} />
              1. 100% Satisfaction Guarantee
            </h2>
            <p>
              At DG MITRA FOR ALL, we stand by our craftsmanship. If you are not 100% satisfied with the transformation of your garment, we will redo the customization for free. Please contact our support team within 7 days of receiving your order to initiate a redo request.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-black flex items-center gap-3">
              <ShoppingBag className="text-brand-green" size={24} />
              2. Customization Orders
            </h2>
            <p>
              Due to the personalized nature of our services, we do not offer full refunds once the customization process has begun. However, if an order is cancelled before the garment is picked up, a full refund will be issued.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-black flex items-center gap-3">
              <AlertCircle className="text-brand-green" size={24} />
              3. Damaged Items
            </h2>
            <p>
              In the unlikely event that your garment is damaged during the transformation process, we will provide a replacement of similar value or a full refund of the service fee plus the estimated value of the garment.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-black flex items-center gap-3">
              <RefreshCw className="text-brand-green" size={24} />
              4. Redo Process
            </h2>
            <p>
              To request a redo, please provide photos of the garment and a description of why you are not satisfied. Our quality control team will review your request and guide you through the next steps.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}

import React from 'react';
import { Lab, LabSession, User } from '@byolabs/shared';
import { X, Printer, Award, CheckCircle2, ShieldCheck } from 'lucide-react';
import unnatiLogo from '../assets/unnati-logo.png';
import byolabsLogo from '../assets/byolabs-logo.png';

interface CertificateModalProps {
  lab: Lab;
  session: LabSession;
  user: User | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ lab, session, user, onClose }) => {
  const issueDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const certificateId = `BYO-CERT-${session.id.replace('lab-', '').toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Top Control Bar (Hidden during print) */}
        <div className="print:hidden p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-200">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">Official Lab Completion Certificate</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-amber-950/40 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Paper Container */}
        <div id="printable-certificate" className="p-8 md:p-12 bg-white text-slate-800 relative overflow-hidden print:p-6 print:bg-white shadow-xl">
          {/* Decorative Gold & Slate Geometric Border */}
          <div className="absolute inset-4 border-2 border-amber-500/50 rounded-xl pointer-events-none" />
          <div className="absolute inset-6 border border-slate-300 rounded-lg pointer-events-none" />

          {/* Background Watermark Icon */}
          <Award className="absolute -right-16 -bottom-16 w-96 h-96 text-amber-500/5 pointer-events-none rotate-12" />

          <div className="relative z-10 text-center space-y-6">
            {/* Header Branding Logos */}
            <div className="flex items-center justify-between px-2 pb-3 border-b border-slate-200">
              {/* Left Upper Corner: Unnati Logo */}
              <div className="flex items-center">
                <img
                  src={unnatiLogo}
                  alt="Unnati Development & Training Centre"
                  className="h-10 md:h-12 w-auto object-contain"
                />
              </div>

              {/* Right Upper Corner: Powered by - Byolabs Logo */}
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Powered by
                </span>
                <img
                  src={byolabsLogo}
                  alt="BYOLabs"
                  className="h-5 md:h-6 w-auto object-contain"
                />
              </div>
            </div>

            {/* Header / Crest */}
            <div className="flex flex-col items-center justify-center space-y-2 pt-1">
              <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-400/60 flex items-center justify-center shadow-md">
                <Award className="w-9 h-9 text-amber-600" />
              </div>
              <span className="text-xs font-mono font-bold tracking-widest text-amber-700 uppercase pt-2">
                Unnati & BYOLabs DevOps & Linux Training Center
              </span>
              <h1 className="text-3xl md:text-4xl font-serif font-extrabold text-amber-900 tracking-tight pt-1">
                CERTIFICATE OF COMPLETION
              </h1>
            </div>

            {/* Recipient Notice */}
            <div className="py-2">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">This is to certify that</p>
              <h2 className="text-2xl md:text-3xl font-serif font-extrabold text-slate-900 mt-2 border-b-2 border-amber-500/60 inline-block px-8 pb-1">
                {user?.name || 'DevOps Student'}
              </h2>
              <p className="text-xs font-mono text-slate-500 mt-1">{user?.email}</p>
            </div>

            {/* Completion Statement */}
            <div className="max-w-xl mx-auto space-y-2">
              <p className="text-sm text-slate-700 leading-relaxed font-sans">
                has successfully completed 100% of all required practical tasks and interactive container lab exercises for
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 my-3 shadow-xs">
                <h3 className="text-xl font-bold text-slate-900 font-sans">{lab.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">Category: {lab.category} • Difficulty: {lab.difficulty}</p>
              </div>
            </div>

            {/* Footer Metadata & Signature */}
            <div className="pt-8 grid grid-cols-2 md:grid-cols-3 gap-6 items-end border-t border-slate-200 text-left">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Issue Date</span>
                <span className="text-xs font-semibold text-slate-800 font-mono">{issueDate}</span>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 text-xs font-mono shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  <span>VERIFIED CERTIFICATE</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 block mt-1">ID: {certificateId}</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Authorized Issuer</span>
                <span className="text-xs font-bold text-amber-800 font-serif block">BYOLabs Verification Engine</span>
                <span className="text-[10px] font-mono text-slate-500">Kubernetes Pod Inspector</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

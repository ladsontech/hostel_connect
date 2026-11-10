'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FaIcon from '@/components/FaIcon';
import { formatUGX } from '@/lib/utils';
import { BusinessFlyer } from '@/components/UniMarketCarousel';

interface PlanOption {
  id: 'weekly' | 'monthly' | 'annual';
  name: string;
  duration: string;
  days: number;
  priceUgx: number;
  badge?: string;
  description: string;
  features: string[];
}

const PLANS: PlanOption[] = [
  {
    id: 'weekly',
    name: 'Weekly Sprint',
    duration: '7 Days Display',
    days: 7,
    priceUgx: 25000,
    description: 'Great for weekly student discounts, weekend events & flash sales.',
    features: [
      '7 days continuous landscape flyer rotation',
      'Reaches ~15,000 active students weekly',
      'Direct WhatsApp or Call button',
      'Target specific university campus'
    ]
  },
  {
    id: 'monthly',
    name: 'Monthly Pro',
    duration: '30 Days Display',
    days: 30,
    priceUgx: 75000,
    badge: 'Most Popular',
    description: 'Best for standard campus businesses, student cafes, laundromats & tech repairs.',
    features: [
      '30 days high-frequency flyer rotation',
      'Reaches ~45,000 campus students & hostel residents',
      'Custom discount / promo badge',
      'Direct WhatsApp, Phone call or Website link',
      '1 free mid-month flyer artwork swap'
    ]
  },
  {
    id: 'annual',
    name: 'Academic Year Pass',
    duration: '365 Days Display',
    days: 365,
    priceUgx: 55000,
    badge: 'Save 40%',
    description: 'Maximum year-round brand presence for prominent campus services & suppliers.',
    features: [
      '365 days permanent featured carousel placement',
      'Priority rotation during semester intake rush',
      'Unlimited promo updates & discount swaps',
      'Social media shoutout on Hostel Connect channels',
      'Featured business badge on listings'
    ]
  }
];

export default function AdvertisePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Business Form State
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Laundry & Dry Cleaning');
  const [campusTarget, setCampusTarget] = useState('Makerere & MUBS Campuses');
  const [headline, setHeadline] = useState('');
  const [tagline, setTagline] = useState('');
  const [discountBadge, setDiscountBadge] = useState('');
  const [contactType, setContactType] = useState<'whatsapp' | 'call' | 'link'>('whatsapp');
  const [contactValue, setContactValue] = useState('');
  const [buttonLabel, setButtonLabel] = useState('Contact Business');

  // Flyer Image
  const [flyerImage, setFlyerImage] = useState<string>('');
  const [fileName, setFileName] = useState('');

  // Selected Plan
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'annual'>('monthly');

  // Payment State
  const [provider, setProvider] = useState<'mtn' | 'airtel'>('mtn');
  const [momoNumber, setMomoNumber] = useState('');
  const [payerName, setPayerName] = useState('');

  // Submission & Simulator Modal State
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'prompting' | 'success'>('idle');
  const [transactionRef, setTransactionRef] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Image Upload from device storage
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, or WEBP).');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFlyerImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setFlyerImage('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Active Plan Object
  const currentPlan = PLANS.find(p => p.id === selectedPlan) || PLANS[1];

  // Validate and Initiate Payment
  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!businessName.trim()) {
      setErrorMsg('Please enter your Business Name.');
      return;
    }
    if (!headline.trim()) {
      setErrorMsg('Please enter a catchy Headline for your flyer.');
      return;
    }
    if (!tagline.trim()) {
      setErrorMsg('Please enter a short description or tagline.');
      return;
    }
    if (!contactValue.trim()) {
      setErrorMsg('Please provide your WhatsApp or Phone number.');
      return;
    }
    if (!flyerImage) {
      setErrorMsg('Please upload a landscape flyer image from your device storage.');
      return;
    }
    if (!momoNumber.trim() || momoNumber.replace(/\D/g, '').length < 9) {
      setErrorMsg('Please enter a valid Ugandan Mobile Money phone number.');
      return;
    }

    // Start payment simulation
    setIsProcessing(true);
    setPaymentStep('prompting');

    // Simulate MoMo USSD Prompt approval after 3 seconds
    setTimeout(() => {
      const generatedRef = `MOMO-HC-${Math.floor(100000 + Math.random() * 900000)}`;
      setTransactionRef(generatedRef);

      // Save new flyer to localStorage so it immediately appears in Uni Market
      const newFlyer: BusinessFlyer = {
        id: `user-flyer-${Date.now()}`,
        businessName: businessName.trim(),
        category,
        headline: headline.trim(),
        tagline: tagline.trim(),
        campusTarget,
        discountBadge: discountBadge.trim() || undefined,
        imageUrl: flyerImage,
        contactAction: {
          type: contactType,
          value: contactType === 'whatsapp'
            ? `https://wa.me/${contactValue.replace(/\D/g, '')}`
            : contactType === 'call'
            ? `tel:${contactValue}`
            : contactValue,
          label: buttonLabel.trim() || 'Contact'
        }
      };

      try {
        const existing = localStorage.getItem('uni_market_flyers');
        const parsed: BusinessFlyer[] = existing ? JSON.parse(existing) : [];
        parsed.unshift(newFlyer);
        localStorage.setItem('uni_market_flyers', JSON.stringify(parsed));
      } catch (err) {
        console.error('Failed to save flyer locally', err);
      }

      setIsProcessing(false);
      setPaymentStep('success');
    }, 3200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full space-y-8">
        {/* Breadcrumb & Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-[#0f3a98] transition">Home</Link>
            <span>/</span>
            <Link href="/#explore" className="hover:text-[#0f3a98] transition">Uni Market</Link>
            <span>/</span>
            <span className="text-[#0f3a98] font-medium">Place Business Flyer</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#ffbe00] text-[#0f3a98]">
                  <FaIcon icon="fa-solid fa-bullhorn" className="text-xs mr-1" />
                  Uni Market Advertising
                </span>
                <span className="text-xs text-slate-500 font-normal">Reaching 45,000+ Ugandan University Students</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-medium text-[#0f3a98] mt-1.5">
                Place Your Business Flyer
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-2xl mt-1">
                Display your landscape business flyer on our high-traffic campus carousel. Students near Makerere, MUBS, Kyambogo, UCU, and KIU can contact you directly with zero middlemen.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto bg-white border border-blue-200 px-4 py-2.5 rounded-xl shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-[#0f3a98] text-[#ffbe00] flex items-center justify-center text-lg shrink-0">
                <FaIcon icon="fa-solid fa-mobile-screen-button" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Instant Activation</div>
                <div className="text-xs font-medium text-[#0f3a98]">MTN MoMo & Airtel Money</div>
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <FaIcon icon="fa-solid fa-circle-exclamation" className="text-sm shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleInitiatePayment} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Details & Plans (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Business Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-[#0f3a98] text-white flex items-center justify-center text-xs font-medium">1</span>
                <h2 className="text-sm font-medium text-[#0f3a98]">Business & Flyer Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kampala Express Laundromat"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#0f3a98] text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Business Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#0f3a98] text-slate-800 bg-white"
                  >
                    <option value="Laundry & Dry Cleaning">Laundry & Dry Cleaning</option>
                    <option value="Student Cafe & Meals">Student Cafe & Meals</option>
                    <option value="Laptop & Phone Repair">Laptop & Phone Repair</option>
                    <option value="Printing & Binding">Printing & Binding</option>
                    <option value="Campus Transit & Boda">Campus Transit & Boda</option>
                    <option value="Gym & Student Wellness">Gym & Student Wellness</option>
                    <option value="Supermarket & Essentials">Supermarket & Essentials</option>
                    <option value="Salon & Grooming">Salon & Grooming</option>
                    <option value="Hostel Furnishing & Decor">Hostel Furnishing & Decor</option>
                    <option value="Campus Services">Campus Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Target Campus / Area <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Makerere (Kikoni) & MUBS (Nakawa)"
                    value={campusTarget}
                    onChange={(e) => setCampusTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#0f3a98] text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Discount / Promo Badge (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 20% Off 1st Order or UGX 5,000 Combo"
                    value={discountBadge}
                    onChange={(e) => setDiscountBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#0f3a98] text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-medium mb-1">
                  Catchy Flyer Headline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Same-Day Student Wash, Dry & Fold"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#0f3a98] text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-medium mb-1">
                  Offer Description / Tagline <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Doorstep pickup from Kikoni, Wandegeya, Nakawa & Banda. Special student rates per basket."
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#0f3a98] text-xs text-slate-800"
                />
              </div>

              {/* Contact Method */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs text-slate-700 font-medium mb-1">
                    Action Type
                  </label>
                  <select
                    value={contactType}
                    onChange={(e) => setContactType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#0f3a98] text-xs text-slate-800 bg-white"
                  >
                    <option value="whatsapp">WhatsApp Chat</option>
                    <option value="call">Phone Call</option>
                    <option value="link">Website Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-700 font-medium mb-1">
                    {contactType === 'whatsapp' ? 'WhatsApp Number' : contactType === 'call' ? 'Phone Number' : 'Website URL'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={contactType === 'link' ? 'https://yourwebsite.com' : '+256 700 000 000'}
                    value={contactValue}
                    onChange={(e) => setContactValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#0f3a98] text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-700 font-medium mb-1">
                    Button Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Order Now / View Menu"
                    value={buttonLabel}
                    onChange={(e) => setButtonLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#0f3a98] text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Upload Flyer from Device Storage */}
              <div className="pt-2">
                <label className="block text-xs text-slate-700 font-medium mb-1.5">
                  Upload Landscape Flyer Image <span className="text-rose-500">*</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  id="flyer-upload-input"
                />

                {!flyerImage ? (
                  <label
                    htmlFor="flyer-upload-input"
                    className="border-2 border-dashed border-blue-200 hover:border-[#0f3a98] bg-blue-50/40 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center group"
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center text-[#0f3a98] group-hover:scale-110 transition-transform mb-2">
                      <FaIcon icon="fa-solid fa-cloud-arrow-up" className="text-lg" />
                    </div>
                    <span className="text-xs font-medium text-[#0f3a98]">
                      Click to browse flyer from your device storage
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      Landscape orientation recommended (PNG, JPG, or WEBP up to 5MB)
                    </span>
                  </label>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={flyerImage}
                        alt="Uploaded Flyer"
                        className="w-16 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-800 truncate">{fileName || 'Custom Flyer'}</div>
                        <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                          <FaIcon icon="fa-solid fa-circle-check" />
                          <span>Image uploaded successfully</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition font-medium"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Choose Plan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-[#0f3a98] text-white flex items-center justify-center text-xs font-medium">2</span>
                <h2 className="text-sm font-medium text-[#0f3a98]">Select Display Duration Plan</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLANS.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative rounded-xl p-4 border-2 cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#0f3a98] bg-[#e8effc]/30 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {plan.badge && (
                        <span className={`absolute -top-2.5 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          plan.id === 'monthly' ? 'bg-[#ffbe00] text-[#0f3a98]' : 'bg-[#0f3a98] text-white'
                        }`}>
                          {plan.badge}
                        </span>
                      )}

                      <div>
                        <div className="text-xs font-medium text-slate-700">{plan.name}</div>
                        <div className="text-base font-medium text-[#0f3a98] mt-1">
                          {formatUGX(plan.priceUgx)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-light mt-0.5">{plan.duration}</div>
                        <p className="text-[11px] text-slate-500 font-normal mt-2 leading-relaxed">
                          {plan.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                        <span className={isSelected ? 'text-[#0f3a98]' : 'text-slate-400'}>
                          {isSelected ? 'Selected' : 'Select Plan'}
                        </span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#0f3a98] bg-[#0f3a98] text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <FaIcon icon="fa-solid fa-check" className="text-[9px]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Mobile Money Payment Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-[#0f3a98] text-white flex items-center justify-center text-xs font-medium">3</span>
                <h2 className="text-sm font-medium text-[#0f3a98]">Mobile Money Payment Details</h2>
              </div>

              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs text-slate-700 font-medium">
                  Choose Mobile Money Network
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProvider('mtn')}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                      provider === 'mtn'
                        ? 'border-[#ffbe00] bg-yellow-50 text-slate-900 ring-1 ring-[#ffbe00]'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-[#ffbe00] text-[#0f3a98] flex items-center justify-center font-bold text-xs shrink-0">
                      M
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-medium">MTN MoMo</div>
                      <div className="text-[10px] text-slate-400">Prompt sent to 077/078/076</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvider('airtel')}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                      provider === 'airtel'
                        ? 'border-rose-500 bg-rose-50 text-slate-900 ring-1 ring-rose-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      A
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-medium">Airtel Money</div>
                      <div className="text-[10px] text-slate-400">Prompt sent to 070/075/074</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Number and Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Phone Number for Deduction <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-medium text-xs">+256</span>
                    <input
                      type="tel"
                      required
                      placeholder="770 000 000"
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      className="w-full pl-13 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#0f3a98] text-slate-800"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    A USSD PIN prompt will pop up on this phone screen.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Registered Account Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Mukasa"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#0f3a98] text-slate-800"
                  />
                </div>
              </div>

              {/* Summary and Pay Button */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-medium">Total Deduction</div>
                  <div className="text-lg font-medium text-[#0f3a98]">
                    {formatUGX(currentPlan.priceUgx)} <span className="text-xs font-normal text-slate-400">({currentPlan.duration})</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  <FaIcon icon="fa-solid fa-lock" className="text-xs text-[#ffbe00]" />
                  <span>Pay {formatUGX(currentPlan.priceUgx)} & Activate Flyer</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Real-time Flyer Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-24 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <FaIcon icon="fa-solid fa-eye" className="text-xs text-[#0f3a98]" />
                  Live Carousel Preview
                </span>
                <span className="text-[11px] text-slate-400 font-light">Updates automatically</span>
              </div>

              {/* Preview Container: Exactly mimics the landscape flyer */}
              <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-[#0f3a98]">
                <div className="relative w-full h-[220px] sm:h-[240px] overflow-hidden">
                  {flyerImage ? (
                    <img
                      src={flyerImage}
                      alt="Preview Flyer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#0a2666] flex flex-col items-center justify-center text-blue-200/50 p-4 text-center">
                      <FaIcon icon="fa-solid fa-image" className="text-3xl mb-2 text-white/30" />
                      <span className="text-xs font-medium text-white/70">Upload flyer image to preview here</span>
                    </div>
                  )}

                  {/* Scrim Overlay */}
                  <div className="absolute inset-0 bg-[#0a2666]/85" />

                  {/* Content Overlay */}
                  <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between text-white z-20">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#ffbe00] text-[#0f3a98] uppercase tracking-wider">
                          {category || 'Category'}
                        </span>
                        <span className="text-[11px] text-blue-200 font-light hidden xs:inline-flex items-center gap-1">
                          <FaIcon icon="fa-solid fa-location-dot" className="text-[10px] text-[#ffbe00]" />
                          <span className="truncate max-w-[130px]">{campusTarget || 'Campus'}</span>
                        </span>
                      </div>

                      {discountBadge && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white text-[#0f3a98] shadow-xs">
                          <FaIcon icon="fa-solid fa-tag" className="text-[9px] text-[#0f3a98] mr-1" />
                          {discountBadge}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 my-auto">
                      <div className="text-[11px] text-[#ffbe00] font-medium uppercase tracking-wide">
                        {businessName || 'Your Business Name'}
                      </div>
                      <h3 className="text-base sm:text-lg font-medium text-white leading-snug line-clamp-2">
                        {headline || 'Your Catchy Flyer Headline Appears Here'}
                      </h3>
                      <p className="text-[11px] text-blue-100 font-light line-clamp-2">
                        {tagline || 'Short promotional description & discount details will be readable right here.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffbe00] text-[#0f3a98] text-[11px] font-medium shadow-xs"
                      >
                        <FaIcon icon={contactType === 'whatsapp' ? 'fa-brands fa-whatsapp' : 'fa-solid fa-phone'} className="text-xs" />
                        <span>{buttonLabel || 'Contact'}</span>
                      </button>

                      <div className="text-[10px] text-blue-200 font-light">
                        Uni Market Carousel
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Plan Recap Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs text-xs">
                <div className="font-medium text-slate-800 flex items-center justify-between">
                  <span>Selected Package:</span>
                  <span className="text-[#0f3a98] font-medium">{currentPlan.name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Display Duration:</span>
                  <span className="font-medium text-slate-700">{currentPlan.duration}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Audience Reach:</span>
                  <span className="font-medium text-slate-700">Makerere, MUBS, Kyambogo & beyond</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-medium">
                  <span className="text-slate-800">Amount Due:</span>
                  <span className="text-sm text-[#0f3a98]">{formatUGX(currentPlan.priceUgx)}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* MoMo USSD Prompt Simulator Modal */}
      {paymentStep !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {paymentStep === 'prompting' ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-yellow-50 border-2 border-[#ffbe00] mx-auto flex items-center justify-center text-2xl text-[#0f3a98] animate-bounce">
                  <FaIcon icon="fa-solid fa-mobile-screen-button" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-medium text-slate-900">
                    Approve Payment on Your Phone
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    A prompt has been sent to <strong className="text-slate-800">+256 {momoNumber}</strong> ({provider === 'mtn' ? 'MTN MoMo' : 'Airtel Money'}).
                  </p>
                </div>

                {/* Simulated USSD Box */}
                <div className="p-4 rounded-xl bg-slate-900 text-yellow-300 font-mono text-xs text-left space-y-1 shadow-inner">
                  <div className="text-white font-medium">{provider === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money'}</div>
                  <div className="text-slate-300">Authorize payment of {formatUGX(currentPlan.priceUgx)} to HOSTEL CONNECT UGANDA?</div>
                  <div className="text-slate-400 text-[10px]">Reference: UNI-MKT-FL-{Date.now().toString().slice(-5)}</div>
                  <div className="text-[#ffbe00] pt-1">Enter PIN on your phone to approve...</div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-[#0f3a98]" />
                  <span>Awaiting customer PIN confirmation...</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-500 mx-auto flex items-center justify-center text-2xl text-emerald-600">
                  <FaIcon icon="fa-solid fa-check" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-medium text-[#0f3a98]">
                    Flyer Successfully Activated!
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Payment of <strong className="text-slate-800">{formatUGX(currentPlan.priceUgx)}</strong> was confirmed via {provider === 'mtn' ? 'MTN MoMo' : 'Airtel Money'}.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction Ref:</span>
                    <span className="font-mono font-medium text-slate-800">{transactionRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="font-medium text-slate-800">{currentPlan.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-medium text-emerald-600 flex items-center gap-1">
                      <FaIcon icon="fa-solid fa-circle-check" /> Live on Uni Market
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => router.push('/')}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f3a98] text-white text-xs font-medium hover:bg-[#0a2666] transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <FaIcon icon="fa-solid fa-store" className="text-[#ffbe00]" />
                    <span>View Live on Uni Market</span>
                  </button>
                  <button
                    onClick={() => {
                      setPaymentStep('idle');
                      setHeadline('');
                      setTagline('');
                      setFlyerImage('');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition"
                  >
                    Place Another Flyer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

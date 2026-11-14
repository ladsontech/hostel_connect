'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { Hostel, HostelPhoto, Offer, SubscriptionPlan, UserSubscription } from '@/types';
import { expandHostelsToRoomCards, formatUGX, getRoomOfferingSummary, isDoubleRoomType, pickRoomCardPhoto } from '@/lib/utils';
import FaIcon from '@/components/FaIcon';
import BoundedSelect from '@/components/BoundedSelect';
import HostelLocationFinder from '@/components/HostelLocationFinder';

/** Reusable image & video gallery manager for creating or editing hostel listings. */
function HostelMediaEditor({
  items,
  onChange,
}: {
  items: HostelPhoto[];
  onChange: (next: HostelPhoto[]) => void;
}) {
  const [urlInput, setUrlInput] = useState('');
  const [urlKind, setUrlKind] = useState<'image' | 'video'>('image');
  const [captionInput, setCaptionInput] = useState('');
  const [mediaNotice, setMediaNotice] = useState('');

  const readMediaFile = (file: File): Promise<HostelPhoto | null> =>
    new Promise((resolve) => {
      if (file.size > 12 * 1024 * 1024) {
        setMediaNotice(`${file.name} exceeds 12MB. Try a smaller file or paste a URL.`);
        resolve(null);
        return;
      }
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (!result) {
          resolve(null);
          return;
        }
        resolve({
          id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          url: result,
          caption: file.name.replace(/\.[^.]+$/, ''),
          isCover: false,
          order: items.length + 1,
          mediaType: isVideo ? 'video' : 'image',
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setMediaNotice('');

    const loaded = (await Promise.all(Array.from(files).map(readMediaFile))).filter(
      (x): x is HostelPhoto => x !== null
    );
    if (loaded.length > 0) {
      const merged = [...items, ...loaded].map((item, idx) => ({ ...item, order: idx + 1 }));
      if (!merged.some(i => i.isCover && i.mediaType !== 'video')) {
        const firstImg = merged.find(i => i.mediaType !== 'video');
        if (firstImg) firstImg.isCover = true;
      }
      onChange(merged);
    }

    e.target.value = '';
  };

  const handleReplaceFile = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaNotice('');
    const replacement = await readMediaFile(file);
    if (replacement) {
      onChange(
        items.map(item =>
          item.id === id
            ? {
                ...replacement,
                id: item.id,
                order: item.order,
                isCover: replacement.mediaType !== 'video' ? item.isCover : false,
              }
            : item
        )
      );
    }
    e.target.value = '';
  };

  const handleAddUrl = () => {
    const clean = urlInput.trim();
    if (!clean) return;
    const isVideo =
      urlKind === 'video' || /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(clean);
    const nextItem: HostelPhoto = {
      id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      url: clean,
      caption: captionInput.trim() || (isVideo ? 'Hostel Video Tour' : 'Hostel Photo'),
      isCover: !isVideo && items.every(i => !i.isCover || i.mediaType === 'video'),
      order: items.length + 1,
      mediaType: isVideo ? 'video' : 'image',
    };
    onChange([...items, nextItem]);
    setUrlInput('');
    setCaptionInput('');
  };

  const handleSetCover = (id: string) => {
    onChange(
      items.map((item) => ({
        ...item,
        isCover: item.id === id && item.mediaType !== 'video',
      }))
    );
  };

  const handleRemove = (id: string) => {
    const remaining = items.filter((i) => i.id !== id);
    if (remaining.length > 0 && !remaining.some(i => i.isCover && i.mediaType !== 'video')) {
      const firstImg = remaining.find(i => i.mediaType !== 'video');
      if (firstImg) firstImg.isCover = true;
    }
    onChange(remaining);
  };

  const handleCaptionChange = (id: string, caption: string) => {
    onChange(items.map(i => (i.id === id ? { ...i, caption } : i)));
  };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
      <div className="flex flex-col items-center justify-center text-center gap-2.5">
        <div className="max-w-sm">
          <div className="text-xs font-semibold text-[#0f3a98]">Hostel Photos &amp; Videos</div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Upload photos/videos from your device or paste links. Photos can be set as the cover image.
          </p>
        </div>
        <label className="cursor-pointer px-4 py-2 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 shadow-xs transition">
          <FaIcon icon="fa-solid fa-cloud-arrow-up" className="text-xs text-[#ffbe00]" />
          <span>Upload Photo / Video</span>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Add via URL */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <div className="sm:col-span-3">
          <BoundedSelect<'image' | 'video'>
            value={urlKind}
            onChange={setUrlKind}
            className="text-xs"
            options={[
              { value: 'image', label: 'Photo URL' },
              { value: 'video', label: 'Video URL' },
            ]}
          />
        </div>
        <input
          type="url"
          placeholder={urlKind === 'video' ? 'https://.../room-tour.mp4' : 'https://.../hostel-photo.jpg'}
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddUrl();
            }
          }}
          className="sm:col-span-4 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
        />
        <input
          type="text"
          placeholder="Caption (optional)"
          value={captionInput}
          onChange={e => setCaptionInput(e.target.value)}
          className="sm:col-span-3 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
        />
        <button
          type="button"
          onClick={handleAddUrl}
          className="sm:col-span-2 px-3 py-2 rounded-lg bg-[#ffbe00] hover:bg-[#e5aa00] text-[#0f3a98] text-xs font-semibold transition"
        >
          Add Media
        </button>
      </div>

      {mediaNotice && (
        <div className="text-[11px] text-rose-600 font-medium">{mediaNotice}</div>
      )}

      {/* Existing Media Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {items.map((item) => {
            const isVideo = item.mediaType === 'video';
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-2 flex items-center gap-2.5 shadow-2xs"
              >
                <div className="w-16 h-14 rounded-lg overflow-hidden bg-slate-900 shrink-0 relative">
                  {isVideo ? (
                    <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <img src={item.url} alt={item.caption || 'Hostel media'} className="w-full h-full object-cover" />
                  )}
                  <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/75 text-[9px] text-white font-medium">
                    {isVideo ? 'VID' : 'IMG'}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <input
                    type="text"
                    value={item.caption || ''}
                    placeholder={isVideo ? 'Video caption' : 'Photo caption'}
                    onChange={e => handleCaptionChange(item.id, e.target.value)}
                    className="w-full px-2 py-1 text-[11px] rounded border border-slate-200 bg-slate-50"
                  />
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      {!isVideo ? (
                        <button
                          type="button"
                          onClick={() => handleSetCover(item.id)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded transition ${
                            item.isCover
                              ? 'bg-[#0f3a98] text-white'
                              : 'bg-[#e8effc] text-[#0f3a98] hover:bg-blue-100'
                          }`}
                        >
                          {item.isCover ? 'Cover' : 'Set Cover'}
                        </button>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500">Video Tour</span>
                      )}
                      <label className="cursor-pointer text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
                        Change
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={e => handleReplaceFile(item.id, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="text-[10px] text-rose-600 hover:text-rose-700 font-medium px-1.5 py-0.5 rounded hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 text-xs text-slate-400">
          No photos or videos added yet.
        </div>
      )}
    </div>
  );
}

export default function SellerPortalPage() {
  const { currentUser, switchRole, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'analytics' | 'subscription' | 'add'>('listings');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Broker / Seller Profile Photo Modal State
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState('');
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // Data states
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'today' | '7days' | 'semester'>('semester');
  const [selectedHostelForAnalytics, setSelectedHostelForAnalytics] = useState<string>('hst_olympia');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // New Hostel Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCampus, setFormCampus] = useState('Makerere University');
  const [formArea, setFormArea] = useState('Kikoni');
  const [formAddress, setFormAddress] = useState('');
  const [formLandmark, setFormLandmark] = useState('');
  const [formLat, setFormLat] = useState('0.3345');
  const [formLng, setFormLng] = useState('32.5621');
  const [formDistance, setFormDistance] = useState('');
  const [formAccessFee, setFormAccessFee] = useState('20000');
  const [formPhone, setFormPhone] = useState('+256 700 123 456');
  const [formRoomOffering, setFormRoomOffering] = useState<'both' | 'single_only' | 'double_only'>('both');
  const [formSingleStyle, setFormSingleStyle] = useState<'single' | 'self_contained_single'>('single');
  const [formDoubleStyle, setFormDoubleStyle] = useState<'double' | 'self_contained_double'>('double');
  const [formSingleRent, setFormSingleRent] = useState('1200000');
  const [formDoubleRent, setFormDoubleRent] = useState('850000');
  const [formSingleAvailable, setFormSingleAvailable] = useState('5');
  const [formDoubleAvailable, setFormDoubleAvailable] = useState('12');
  const [formMedia, setFormMedia] = useState<HostelPhoto[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Edit Hostel Modal State (for Broker & Custodian listings)
  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null);
  const [editName, setEditName] = useState('');
  const [editCampus, setEditCampus] = useState('Makerere University');
  const [editArea, setEditArea] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLandmark, setEditLandmark] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editDistance, setEditDistance] = useState('');
  const [editGender, setEditGender] = useState<'mixed' | 'girls_only' | 'boys_only'>('mixed');
  const [editDescription, setEditDescription] = useState('');
  const [editAmenities, setEditAmenities] = useState<string[]>([]);
  const [editMedia, setEditMedia] = useState<HostelPhoto[]>([]);
  const [editRooms, setEditRooms] = useState<Hostel['rooms']>([]);
  const [editAccessFee, setEditAccessFee] = useState<string>('15000');
  const [editSaving, setEditSaving] = useState(false);

  // Inline Quick Fee Editor State (tap Inspection Fee pill to edit immediately)
  const [quickFeeHostelId, setQuickFeeHostelId] = useState<string | null>(null);
  const [quickFeeValue, setQuickFeeValue] = useState<string>('');
  const [quickFeeSaving, setQuickFeeSaving] = useState(false);

  // Duplicate Check Modal State
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  const [bypassReason, setBypassReason] = useState('');

  // Payment State
  const [selectedPlanId, setSelectedPlanId] = useState('plan_custodian_standard');
  const [momoPhone, setMomoPhone] = useState('+256 772 111 222');
  const [momoProvider, setMomoProvider] = useState<'mtn_momo' | 'airtel_money'>('mtn_momo');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // Editing rooms (per-hostel, per-room quick vacancy inputs keyed by `${hostelId}:${roomId}`)
  const [quickVacancies, setQuickVacancies] = useState<Record<string, number>>({});
  const [updateMsg, setUpdateMsg] = useState('');

  useEffect(() => {
    if (currentUser?.role === 'broker' && activeTab === 'subscription') {
      setActiveTab('listings');
    } else if (currentUser?.role === 'custodian') {
      setSelectedPlanId('plan_custodian_standard');
    }
  }, [currentUser?.role, activeTab]);

  const loadData = async () => {
    try {
      const [hostelsRes, subRes] = await Promise.all([
        fetch('/api/v1/hostels?includeUnapproved=true'),
        fetch(`/api/v1/subscriptions?userId=${currentUser?.id || 'usr_custodian_olympia'}`)
      ]);
      const hData = await hostelsRes.json();
      const sData = await subRes.json();
      if (hData.success) {
        setHostels(hData.hostels);
        if (Array.isArray(hData.offers)) setOffers(hData.offers);
      }
      if (sData.success) {
        setPlans(sData.plans);
        setSubscription(sData.subscription);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAnalytics = async () => {
    if (!selectedHostelForAnalytics) return;
    try {
      const res = await fetch(`/api/v1/leads?hostelId=${selectedHostelForAnalytics}&timeframe=${analyticsTimeframe}`);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data.analytics);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  useEffect(() => {
    loadAnalytics();
  }, [selectedHostelForAnalytics, analyticsTimeframe]);

  const handleAddHostel = async (e: React.FormEvent, forceBypass = false) => {
    e.preventDefault();
    setFormSubmitting(true);
    setDuplicateWarning(null);

    const payload = {
      name: formName,
      description: formDescription,
      campus: formCampus,
      area: formArea,
      address: formAddress || `${formArea}, near ${formLandmark}`,
      landmark: formLandmark,
      lat: parseFloat(formLat),
      lng: parseFloat(formLng),
      distanceCampusApprox: formDistance.trim() || undefined,
      genderPolicy: 'mixed',
      amenities: ['water', 'security', 'wifi', 'power_backup'],
      sellerId: currentUser?.id || 'usr_custodian_olympia',
      sellerRole: currentUser?.role || 'custodian',
      sellerName: currentUser?.name,
      sellerAvatarUrl: currentUser?.avatarUrl,
      contactPhone: formPhone,
      whatsapp: formPhone,
      accessFeeUgx: parseInt(formAccessFee) || 0,
      photos: formMedia.length > 0 ? formMedia : undefined,
      rooms: [
        ...(formRoomOffering === 'both' || formRoomOffering === 'single_only'
          ? [
              {
                name: formSingleStyle === 'self_contained_single' ? 'Single Self-Contained' : 'Single Room',
                type: formSingleStyle,
                rentUgx: parseInt(formSingleRent, 10) || 1000000,
                roomsTotal: Math.max(parseInt(formSingleAvailable, 10) || 0, 30),
                roomsAvailable: Math.max(0, parseInt(formSingleAvailable, 10) || 0),
              },
            ]
          : []),
        ...(formRoomOffering === 'both' || formRoomOffering === 'double_only'
          ? [
              {
                name: formDoubleStyle === 'self_contained_double' ? 'Double Self-Contained' : 'Double Room',
                type: formDoubleStyle,
                rentUgx: parseInt(formDoubleRent, 10) || 750000,
                roomsTotal: Math.max(parseInt(formDoubleAvailable, 10) || 0, 50),
                roomsAvailable: Math.max(0, parseInt(formDoubleAvailable, 10) || 0),
              },
            ]
          : []),
      ],
      forceCreate: forceBypass,
      duplicateBypassReason: bypassReason
    };

    try {
      const res = await fetch('/api/v1/hostels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.status === 409 && data.duplicateDetected) {
        setDuplicateWarning(data);
      } else if (data.success) {
        const isPendingApproval = data.hostel?.approvalStatus === 'pending';
        setUpdateMsg(
          isPendingApproval
            ? `Hostel "${data.hostel.name}" uploaded and queued for Admin approval. It is shown below as Pending Approval, and you can edit its details, photos, and videos anytime.`
            : `Hostel "${data.hostel.name}" published! You can edit its details, photos, and videos anytime below.`
        );
        setHostels(prev => [data.hostel, ...prev]);
        if (data.offer) setOffers(prev => [...prev, data.offer]);
        setActiveTab('listings');
        setFormName('');
        setFormDescription('');
        setFormAddress('');
        setFormLandmark('');
        setFormDistance('');
        setFormRoomOffering('both');
        setFormSingleAvailable('5');
        setFormDoubleAvailable('12');
        setFormMedia([]);
        setBypassReason('');
      } else {
        alert(data.error || 'Failed to add hostel');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const openEditHostelModal = (hostel: Hostel) => {
    setEditingHostel(hostel);
    setEditName(hostel.name);
    setEditCampus(hostel.campus);
    setEditArea(hostel.area);
    setEditAddress(hostel.address);
    setEditLandmark(hostel.landmark);
    setEditLat(String(hostel.lat));
    setEditLng(String(hostel.lng));
    setEditDistance(hostel.distanceCampusApprox);
    setEditGender(hostel.genderPolicy);
    setEditDescription(hostel.description);
    setEditAmenities(Array.isArray(hostel.amenities) ? hostel.amenities : []);
    setEditMedia(hostel.photos || []);
    setEditRooms(hostel.rooms || []);
    const existingOffer = offers.find(o => o.hostelId === hostel.id && o.userId === currentUser?.id);
    setEditAccessFee(existingOffer ? String(existingOffer.accessFeeUgx) : '15000');
  };

  const handleSaveHostelEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHostel) return;
    setEditSaving(true);

    const canEditRooms =
      currentUser?.role === 'custodian' || editingHostel.status === 'unclaimed';

    try {
      const res = await fetch(`/api/v1/hostels/${editingHostel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          userRole: currentUser?.role,
          userName: currentUser?.name,
          userPhone: currentUser?.phone,
          userAvatarUrl: currentUser?.avatarUrl,
          name: editName,
          campus: editCampus,
          area: editArea,
          address: editAddress,
          landmark: editLandmark,
          lat: parseFloat(editLat),
          lng: parseFloat(editLng),
          distanceCampusApprox: editDistance,
          genderPolicy: editGender,
          description: editDescription,
          amenities: editAmenities,
          photos: editMedia,
          ...(currentUser?.role === 'broker' ? { accessFeeUgx: parseInt(editAccessFee, 10) || 0 } : {}),
          ...(canEditRooms ? { rooms: editRooms } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHostels(prev => prev.map(h => (h.id === editingHostel.id ? data.hostel : h)));
        if (data.offer) {
          setOffers(prev => {
            const exists = prev.some(o => o.id === data.offer.id);
            return exists
              ? prev.map(o => (o.id === data.offer.id ? data.offer : o))
              : [...prev, data.offer];
          });
        }
        setUpdateMsg(`Updated "${data.hostel.name}" photos, details, and pricing successfully.`);
        setTimeout(() => setUpdateMsg(''), 4000);
        setEditingHostel(null);
      } else {
        alert(data.error || 'Failed to update hostel');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleSaveQuickFee = async (e: React.FormEvent, hostel: Hostel) => {
    e.preventDefault();
    if (!currentUser) return;
    setQuickFeeSaving(true);
    try {
      const parsedFee = Math.max(0, parseInt(quickFeeValue, 10) || 0);
      const res = await fetch(`/api/v1/hostels/${hostel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userRole: currentUser.role,
          userName: currentUser.name,
          userPhone: currentUser.phone,
          userAvatarUrl: currentUser.avatarUrl,
          accessFeeUgx: parsedFee,
        }),
      });
      const data = await res.json();
      if (data.success && data.offer) {
        setOffers(prev => {
          const exists = prev.some(o => o.id === data.offer.id);
          return exists
            ? prev.map(o => (o.id === data.offer.id ? data.offer : o))
            : [...prev, data.offer];
        });
        setQuickFeeHostelId(null);
        setUpdateMsg(
          `Inspection fee for "${hostel.name}" updated to ${formatUGX(parsedFee)}.`
        );
        setTimeout(() => setUpdateMsg(''), 4000);
      } else {
        alert(data.error || 'Failed to save inspection fee');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to save inspection fee');
    } finally {
      setQuickFeeSaving(false);
    }
  };

  const handleUpdateRooms = async (hostel: Hostel) => {
    const updatedRooms = hostel.rooms.map((room) => {
      const key = `${hostel.id}:${room.id}`;
      const nextAvailable =
        quickVacancies[key] !== undefined ? Math.max(0, quickVacancies[key]) : room.roomsAvailable;
      return {
        ...room,
        roomsAvailable: nextAvailable,
        roomsTotal: Math.max(room.roomsTotal || 0, nextAvailable),
      };
    });

    try {
      const res = await fetch(`/api/v1/hostels/${hostel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          userRole: currentUser?.role,
          rooms: updatedRooms,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUpdateMsg('Rooms availability updated and synchronized across all broker listings.');
        setTimeout(() => setUpdateMsg(''), 3000);
        loadData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleProcessMomoPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentProcessing(true);
    setPaymentSuccessMsg('');

    try {
      const res = await fetch('/api/v1/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'usr_custodian_olympia',
          planId: selectedPlanId,
          provider: momoProvider,
          phone: momoPhone,
          hostelId: selectedHostelForAnalytics
        })
      });
      const data = await res.json();
      if (data.success) {
        setPaymentSuccessMsg(data.message);
        setSubscription(data.subscription);
      } else {
        alert(data.error || 'Payment failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const portalHostels = hostels.filter(h => {
    if (h.status === 'suspended') return false;
    if (currentUser?.role === 'custodian') {
      const isOwner = h.verifiedOwnerId === currentUser.id;
      const isMySubmission = h.scoutUserId === currentUser.id;
      const hasMyCustodianOffer = offers.some(
        o => o.hostelId === h.id && o.userId === currentUser.id && o.userRole === 'custodian'
      );
      return isOwner || isMySubmission || hasMyCustodianOffer;
    }
    const approval = h.approvalStatus || 'approved';
    if (approval === 'approved') return true;
    return h.scoutUserId === currentUser?.id;
  });

  useEffect(() => {
    if (
      portalHostels.length > 0 &&
      !portalHostels.some(h => h.id === selectedHostelForAnalytics)
    ) {
      setSelectedHostelForAnalytics(portalHostels[0].id);
    }
  }, [currentUser?.id, currentUser?.role, hostels, offers, selectedHostelForAnalytics]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar onOpenAuth={(mode) => {
        setAuthMode(mode || 'login');
        setIsAuthOpen(true);
      }} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Role Gate when logged in as Student (shows the real difference vs Broker & Custodian) */}
        {(!currentUser || currentUser.role === 'student') ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center max-w-2xl mx-auto space-y-5 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#e8effc] text-[#0f3a98] mx-auto flex items-center justify-center border border-blue-200">
              <FaIcon icon="fa-solid fa-graduation-cap" className="text-2xl text-[#0f3a98]" />
            </div>
            <div className="space-y-1.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8effc] text-[#0f3a98]">
                {currentUser ? `Signed in as ${currentUser.name} (Student)` : 'Not Signed In'}
              </span>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#0f3a98]">
                Student Account View vs Broker &amp; Custodian Portals
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                Students browse hostels, compare rooms, pay connection fees, and schedule room inspections. Listing management &amp; analytics are separated into Broker and Custodian portals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <a
                href="/"
                className="p-3.5 rounded-xl border border-blue-200 bg-[#e8effc]/60 hover:bg-[#e8effc] text-[#0f3a98] text-xs font-semibold flex flex-col items-center gap-1 transition"
              >
                <FaIcon icon="fa-solid fa-magnifying-glass" className="text-base text-[#0f3a98]" />
                <span>Stay in Student View</span>
                <span className="text-[10px] font-normal text-slate-600">Browse &amp; Book Hostels</span>
              </a>

              <button
                type="button"
                onClick={() => switchRole('broker')}
                className="p-3.5 rounded-xl border border-[#ffbe00] bg-[#ffbe00]/15 hover:bg-[#ffbe00]/25 text-[#0f3a98] text-xs font-semibold flex flex-col items-center gap-1 transition"
              >
                <FaIcon icon="fa-solid fa-person-walking" className="text-base text-[#0f3a98]" />
                <span>Switch to Broker</span>
                <span className="text-[10px] font-normal text-slate-600">Inspection Offers &amp; Leads</span>
              </button>

              <button
                type="button"
                onClick={() => switchRole('custodian')}
                className="p-3.5 rounded-xl bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-semibold flex flex-col items-center gap-1 shadow-sm transition"
              >
                <FaIcon icon="fa-solid fa-hotel" className="text-base text-[#ffbe00]" />
                <span>Switch to Custodian</span>
                <span className="text-[10px] font-normal text-blue-100">Room Vacancy &amp; Owner Portal</span>
              </button>
            </div>
          </div>
        ) : (
        <>
        {/* Top Seller Profile Card (Editorial Cover + Overlapping Avatar + Metrics + Portal Tabs) */}
        {(() => {
          const totalViews = portalHostels.reduce((sum, h) => sum + (h.viewCount || 0), 0);
          const totalSaves = portalHostels.reduce((sum, h) => sum + (h.saveCount || 0), 0);
          const formattedViews =
            totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}K` : String(totalViews);
          const myOffersCount = offers.filter(o => o.userId === currentUser?.id).length;
          const totalVacantRooms = portalHostels.reduce(
            (sum, h) => sum + h.rooms.reduce((rSum, r) => rSum + (r.roomsAvailable || 0), 0),
            0
          );

          return (
            <div className="bg-white rounded-[24px] border border-slate-200 p-3 sm:p-4 shadow-sm">
              {/* Inset Solid Theme-Blue Cover Banner */}
              <div className="relative h-28 sm:h-32 rounded-[18px] bg-[#0f3a98] overflow-hidden">
                <span className="pointer-events-none absolute -top-10 -left-8 w-36 h-36 rounded-full bg-white/[0.06]" />
                <span className="pointer-events-none absolute -bottom-12 right-12 w-44 h-44 rounded-full bg-white/[0.06]" />
                <button
                  type="button"
                  onClick={() => setActiveTab('add')}
                  title="Add Hostel"
                  aria-label="Add Hostel"
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white hover:bg-[#ffbe00] text-[#0f3a98] shadow-md flex items-center justify-center transition"
                >
                  <FaIcon icon="fa-solid fa-plus" className="text-sm" />
                </button>
              </div>

              {/* Overlapping Centered Circular Avatar (click or use camera button to add/edit profile photo) */}
              <div className="relative z-10 -mt-11 sm:-mt-12 flex flex-col items-center">
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarDraft(currentUser?.avatarUrl || '');
                      setAvatarError('');
                      setAvatarModalOpen(true);
                    }}
                    title="Add or edit your profile picture"
                    className="w-20 h-20 sm:w-22 sm:h-22 rounded-full ring-4 ring-white border-2 border-[#0f3a98] bg-[#edf2fc] overflow-hidden shadow-md flex items-center justify-center focus:outline-none focus:ring-[#ffbe00] transition"
                  >
                    {currentUser?.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-semibold text-[#0f3a98]">
                        {(currentUser?.name || 'HC')
                          .split(' ')
                          .map(n => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarDraft(currentUser?.avatarUrl || '');
                      setAvatarError('');
                      setAvatarModalOpen(true);
                    }}
                    aria-label="Edit profile picture"
                    title="Add or edit profile picture"
                    className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-[#ffbe00] hover:bg-[#0f3a98] border-2 border-white flex items-center justify-center text-[#0f3a98] hover:text-white shadow-sm transition"
                  >
                    <FaIcon icon="fa-solid fa-camera" className="text-[11px]" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAvatarDraft(currentUser?.avatarUrl || '');
                    setAvatarError('');
                    setAvatarModalOpen(true);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f3a98] hover:bg-[#0a2666] text-white border border-[#0f3a98] text-[11px] font-medium shadow-xs transition"
                >
                  <FaIcon icon="fa-solid fa-camera" className="text-[10px] text-[#ffbe00]" />
                  <span>{currentUser?.avatarUrl ? 'Edit Profile Photo' : 'Add Profile Photo'}</span>
                </button>
              </div>

              {/* Centered Name & Role Bio */}
              <div className="text-center px-3 pt-3">
                <h1 className="text-xl sm:text-2xl font-semibold text-[#0f3a98] leading-tight">
                  {currentUser?.businessName || currentUser?.name || 'Seller Hub'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-md mx-auto leading-relaxed">
                  {currentUser?.role === 'custodian'
                    ? 'Authoritative owner portal: control room vacancy, approve brokers, and view direct inquiries.'
                    : 'Campus scout portal: attach verified offers, disclose viewing fees, and track student leads.'}
                </p>
              </div>

              {/* 3-Column Metrics Tray */}
              <div className="mt-4 max-w-xl mx-auto w-full bg-slate-50 border border-slate-200/80 rounded-2xl grid grid-cols-3 divide-x divide-slate-200/80 py-3 px-2 text-center">
                <div className="px-2">
                  <div className="text-base sm:text-lg font-semibold text-slate-900 tabular-nums">
                    {portalHostels.length}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                    {currentUser?.role === 'custodian' ? 'My Property' : 'Listings'}
                  </div>
                </div>
                <div className="px-2">
                  <div className="text-base sm:text-lg font-semibold text-slate-900 tabular-nums">
                    {currentUser?.role === 'custodian' ? totalVacantRooms : myOffersCount}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                    {currentUser?.role === 'custodian' ? 'Vacant Rooms' : 'Active Fees'}
                  </div>
                </div>
                <div className="px-2">
                  <div className="text-base sm:text-lg font-semibold text-slate-900 tabular-nums">
                    {formattedViews}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                    Views • {totalSaves}
                  </div>
                </div>
              </div>

              {/* Bottom Centered Portal Tabs */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-center">
                <div className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-medium">
                  <button
                    onClick={() => setActiveTab('listings')}
                    className={`px-3.5 py-2.5 sm:py-2 rounded-lg transition text-center whitespace-nowrap ${
                      activeTab === 'listings' ? 'bg-[#0f3a98] text-[#ffbe00] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    My Listings
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-3.5 py-2.5 sm:py-2 rounded-lg transition text-center whitespace-nowrap ${
                      activeTab === 'analytics' ? 'bg-[#0f3a98] text-[#ffbe00] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Lead Analytics
                  </button>
                  {currentUser?.role === 'custodian' && (
                    <button
                      onClick={() => setActiveTab('subscription')}
                      className={`px-3.5 py-2.5 sm:py-2 rounded-lg transition text-center whitespace-nowrap ${
                        activeTab === 'subscription' ? 'bg-[#0f3a98] text-[#ffbe00] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Subscription &amp; MoMo
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('add')}
                    className={`px-3.5 py-2.5 sm:py-2 rounded-lg bg-[#ffbe00] hover:bg-[#e5aa00] text-[#0f3a98] font-semibold transition flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap ${
                      currentUser?.role === 'broker' ? 'col-span-2 sm:col-span-1' : ''
                    }`}
                  >
                    <FaIcon icon="fa-solid fa-plus" className="text-xs" />
                    <span>Add Hostel</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 1: LISTINGS & INVENTORY MANAGEMENT */}
        {activeTab === 'listings' && (() => {
          const visibleHostels = portalHostels;
          const isBroker = currentUser?.role === 'broker';
          const pendingHostelsCount = isBroker
            ? visibleHostels.filter(h => h.approvalStatus === 'pending').length
            : 0;
          return (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center text-center gap-2">
              <div className="max-w-lg">
                <h2 className="text-lg font-medium text-[#0f3a98]">
                  {isBroker ? 'Active Accommodations' : 'My Hostel Properties'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isBroker
                    ? 'Set inspection fees, edit hostel details & media, or track your unapproved submissions'
                    : 'Manage your hostel vacancy numbers, room rates, amenities, photos & videos'}
                </p>
              </div>
              {isBroker && pendingHostelsCount > 0 && (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#ffbe00] text-white border border-[#ffbe00] flex items-center gap-1.5 shadow-xs">
                  <FaIcon icon="fa-solid fa-clock" className="text-[11px] text-white" />
                  <span>{pendingHostelsCount} Pending Admin Approval</span>
                </span>
              )}
            </div>

            {isBroker && pendingHostelsCount > 0 && (
              <div className="p-3.5 sm:p-4 bg-[#0f3a98] border border-[#0f3a98] text-white text-xs font-medium rounded-xl flex items-start gap-2.5 shadow-xs">
                <FaIcon icon="fa-solid fa-hourglass-half" className="text-[#ffbe00] mt-0.5 shrink-0" />
                <span>
                  Hostels uploaded by brokers require Admin approval before appearing in public student search. Unapproved submissions remain visible below so you can inspect or edit their details, photos, and videos while awaiting approval.
                </span>
              </div>
            )}

            {updateMsg && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-[#0f3a98] text-xs font-medium rounded-xl flex items-center gap-2">
                <FaIcon icon="fa-solid fa-circle-check" className="text-[#0f3a98]" />
                <span>{updateMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expandHostelsToRoomCards(
                [...visibleHostels].sort((a, b) => {
                  const aPending = a.approvalStatus === 'pending' ? 2 : 0;
                  const bPending = b.approvalStatus === 'pending' ? 2 : 0;
                  const aMine = a.scoutUserId === currentUser?.id ? 1 : 0;
                  const bMine = b.scoutUserId === currentUser?.id ? 1 : 0;
                  return (bPending + bMine) - (aPending + aMine);
                })
              ).map(({ cardKey, hostel, room, roomIndex }) => {
                const roomsToShow = room ? [room] : hostel.rooms;
                const totalRooms = room ? room.roomsTotal : hostel.rooms.reduce((acc, r) => acc + r.roomsTotal, 0);
                const availableRooms = room ? room.roomsAvailable : hostel.rooms.reduce((acc, r) => acc + r.roomsAvailable, 0);
                const isUploadedByMe = hostel.scoutUserId === currentUser?.id;
                const approval = hostel.approvalStatus || 'approved';
                const canEditHostel =
                  currentUser?.role === 'custodian' ||
                  currentUser?.role === 'broker' ||
                  isUploadedByMe ||
                  hostel.status === 'unclaimed';
                const myOffer = offers.find(
                  o => o.hostelId === hostel.id && o.userId === currentUser?.id
                );
                const coverPhoto = pickRoomCardPhoto(hostel.photos, room, roomIndex);
                const photoCount = hostel.photos.filter(p => p.mediaType !== 'video').length;
                const videoCount = hostel.photos.filter(p => p.mediaType === 'video').length;
                const roomDetailHref = room
                  ? `/hostels/${hostel.id}?room=${encodeURIComponent(room.id)}`
                  : `/hostels/${hostel.id}`;

                return (
                  <div
                    key={cardKey}
                    className={`bg-white rounded-2xl border p-4 sm:p-5 space-y-4 shadow-sm transition hover:shadow-md flex flex-col justify-between ${
                      approval === 'pending'
                        ? 'border-amber-300 ring-1 ring-amber-200/70'
                        : approval === 'rejected'
                          ? 'border-rose-300'
                          : 'border-slate-200'
                    }`}
                  >
                    {/* Top Card Header: Thumbnail + Roomy Title & Location + Separate Status/Vacancy Bar */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3.5">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#edf2fc] border border-slate-200 shrink-0 flex items-center justify-center">
                          {coverPhoto ? (
                            <img
                              src={coverPhoto.url}
                              alt={room ? `${hostel.name} - ${room.name}` : hostel.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FaIcon icon="fa-solid fa-building" className="text-xl text-[#0f3a98]/50" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-semibold text-[#0f3a98] leading-snug">
                              {hostel.name}
                            </h3>
                            {room && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0f3a98] text-white text-[10px] font-semibold whitespace-nowrap">
                                <FaIcon
                                  icon={isDoubleRoomType(room.type) ? 'fa-solid fa-user-group' : 'fa-solid fa-bed'}
                                  className="text-[9px] text-[#ffbe00]"
                                />
                                <span>{room.name}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-medium">
                            {hostel.area} • {hostel.campus}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium flex items-start gap-1.5 leading-snug">
                            <FaIcon icon="fa-solid fa-location-dot" className="text-[#0f3a98] text-[10px] mt-0.5 shrink-0" />
                            <span>{hostel.distanceCampusApprox}</span>
                          </p>
                        </div>
                      </div>

                      {/* Roomy Full-Width Status Badges & Vacancy Summary Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#0f3a98] text-white border border-[#0f3a98] whitespace-nowrap">
                            {hostel.status === 'claimed' ? 'Verified Owner' : 'Unclaimed'}
                          </span>
                          {approval === 'pending' && (
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#ffbe00] text-white border border-[#ffbe00] whitespace-nowrap">
                              Pending Approval
                            </span>
                          )}
                          {approval === 'rejected' && (
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
                              Rejected
                            </span>
                          )}
                          {isUploadedByMe && (
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#ffbe00] text-[#0f3a98] whitespace-nowrap">
                              Uploaded by You
                            </span>
                          )}
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0f3a98] text-white text-[11px] font-semibold whitespace-nowrap shrink-0">
                          <span className="text-[#ffbe00] tabular-nums">{availableRooms}/{totalRooms}</span>
                          <span>Vacant</span>
                        </div>
                      </div>

                      {/* Visible Uploaded Photos & Videos Gallery Strip */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#0f3a98]">
                            Uploaded Media ({photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}, {videoCount} {videoCount === 1 ? 'Video' : 'Videos'})
                          </span>
                          {canEditHostel && (
                            <button
                              type="button"
                              onClick={() => openEditHostelModal(hostel)}
                              className="text-[#0f3a98] hover:underline font-medium"
                            >
                              Change Photos
                            </button>
                          )}
                        </div>
                        {hostel.photos.length > 0 ? (
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {hostel.photos.map((media, mIdx) => {
                              const isVid = media.mediaType === 'video';
                              return (
                                <button
                                  key={media.id || mIdx}
                                  type="button"
                                  onClick={() => canEditHostel && openEditHostelModal(hostel)}
                                  title={media.caption || (isVid ? 'Change video' : 'Change photo')}
                                  className="relative w-20 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 shrink-0 group"
                                >
                                  {isVid ? (
                                    <video src={media.url} className="w-full h-full object-cover" muted playsInline />
                                  ) : (
                                    <img
                                      src={media.url}
                                      alt={media.caption || hostel.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                  )}
                                  {media.isCover && !isVid && (
                                    <span className="absolute top-1 left-1 px-1 py-0.5 rounded bg-[#0f3a98] text-white text-[9px] font-semibold leading-none">
                                      Cover
                                    </span>
                                  )}
                                  {isVid && (
                                    <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/75 text-white text-[9px] font-semibold leading-none">
                                      Video
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">No photos uploaded yet.</div>
                        )}
                      </div>

                      {/* Clean Room Inventory Section */}
                      <div className="bg-slate-50/90 p-3 sm:p-3.5 rounded-xl border border-slate-200/70 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">
                              {room ? 'Room Rate & Vacancy' : 'Rooms & Rates'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#0f3a98] text-white text-[10px] font-semibold border border-[#0f3a98]">
                              {room
                                ? (isDoubleRoomType(room.type) ? 'Double Room Card' : 'Single Room Card')
                                : getRoomOfferingSummary(hostel.rooms).label}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap flex items-center gap-1">
                            <FaIcon
                              icon={hostel.status === 'claimed' && currentUser?.role === 'broker' ? 'fa-solid fa-lock' : 'fa-solid fa-pen'}
                              className="text-[10px] text-slate-400"
                            />
                            {hostel.status === 'claimed' && currentUser?.role === 'broker'
                              ? 'Owner sets rates'
                              : 'Editable'}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {roomsToShow.map(r => (
                            <div
                              key={r.id}
                              className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-white border border-slate-200/80"
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-slate-900 truncate">{r.name}</div>
                                <div className="text-[11px] font-semibold text-[#0f3a98] mt-0.5 whitespace-nowrap">
                                  {formatUGX(r.rentUgx)}{' '}
                                  <span className="font-normal text-slate-400">/ sem</span>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded-lg bg-[#0f3a98] text-white text-[11px] font-semibold shrink-0 whitespace-nowrap">
                                {r.roomsAvailable} left
                              </span>
                            </div>
                          ))}
                        </div>

                        {currentUser?.role === 'custodian' && roomsToShow.length > 0 && (
                          <div className="pt-1.5 flex flex-wrap items-center gap-2">
                            {roomsToShow.map((r) => {
                              const qKey = `${hostel.id}:${r.id}`;
                              const val =
                                quickVacancies[qKey] !== undefined ? quickVacancies[qKey] : '';
                              return (
                                <input
                                  key={r.id}
                                  type="number"
                                  min="0"
                                  value={val}
                                  placeholder={`${r.name} vacant (${r.roomsAvailable})`}
                                  onChange={e => {
                                    const parsed = parseInt(e.target.value, 10);
                                    setQuickVacancies(prev => {
                                      if (e.target.value === '' || isNaN(parsed)) {
                                        const next = { ...prev };
                                        delete next[qKey];
                                        return next;
                                      }
                                      return { ...prev, [qKey]: Math.max(0, parsed) };
                                    });
                                  }}
                                  className="w-44 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
                                />
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => handleUpdateRooms(hostel)}
                              className="px-3 py-1.5 bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-medium rounded-lg transition whitespace-nowrap"
                            >
                              Update Vacancy
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Clean Action & Fee Footer */}
                    <div className="pt-2 border-t border-slate-100 space-y-2.5">
                      {currentUser?.role === 'broker' && quickFeeHostelId === cardKey && (
                        <form
                          onSubmit={e => handleSaveQuickFee(e, hostel)}
                          className="p-2.5 rounded-xl bg-[#0f3a98] text-white flex flex-wrap items-center gap-2 shadow-xs"
                        >
                          <label className="text-[11px] font-semibold text-white shrink-0">
                            Fee (UGX):
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            inputMode="numeric"
                            autoFocus
                            required
                            placeholder="e.g. 15000"
                            value={quickFeeValue}
                            onChange={e => setQuickFeeValue(e.target.value)}
                            className="flex-1 min-w-[110px] px-2.5 py-1.5 text-xs rounded-lg bg-white text-[#0f3a98] font-semibold focus:outline-none focus:ring-2 focus:ring-[#ffbe00]"
                          />
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="submit"
                              disabled={quickFeeSaving}
                              className="px-3 py-1.5 rounded-lg bg-[#ffbe00] hover:bg-amber-400 text-[#0f3a98] text-[11px] font-semibold transition disabled:opacity-60"
                            >
                              {quickFeeSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickFeeHostelId(null)}
                              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#0f3a98] text-[11px] font-semibold transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[11px] font-medium">
                          {currentUser?.role === 'broker' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setQuickFeeHostelId(cardKey);
                                setQuickFeeValue(myOffer ? String(myOffer.accessFeeUgx) : '');
                              }}
                              title="Tap to edit inspection fee immediately"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-white font-semibold whitespace-nowrap transition cursor-pointer shadow-xs ${
                                myOffer
                                  ? 'bg-[#0f3a98] hover:bg-[#0a2666] border-[#0f3a98]'
                                  : 'bg-red-600 hover:bg-red-700 border-red-600'
                              }`}
                            >
                              <FaIcon
                                icon="fa-solid fa-tag"
                                className={`text-[10px] ${myOffer ? 'text-[#ffbe00]' : 'text-white'}`}
                              />
                              <span>
                                {myOffer
                                  ? `Inspection Fee: ${formatUGX(myOffer.accessFeeUgx)}`
                                  : 'Inspection Fee: Not Set'}
                              </span>
                              <FaIcon icon="fa-solid fa-pen" className="text-[9px] opacity-85" />
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#edf2fc] text-[#0f3a98]">
                              <FaIcon icon="fa-solid fa-image" className="text-[10px]" />
                              {photoCount} Photos • {videoCount} Videos
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={roomDetailHref}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-medium inline-flex items-center gap-1 transition whitespace-nowrap"
                          >
                            <FaIcon icon="fa-solid fa-eye" className="text-[10px]" />
                            <span>Preview</span>
                          </Link>
                          {canEditHostel && (
                            <button
                              type="button"
                              onClick={() => openEditHostelModal(hostel)}
                              className="px-3 py-1.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white text-[11px] font-semibold inline-flex items-center gap-1.5 shadow-xs transition whitespace-nowrap"
                            >
                              <FaIcon icon="fa-solid fa-pen-to-square" className="text-[10px] text-[#ffbe00]" />
                              <span>Edit All Details</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          );
        })()}

        {/* TAB 2: SELLER ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#0f3a98]">Student Inquiries &amp; Leads</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Track students reaching your listings via WhatsApp, calls, and saves
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto">
                <BoundedSelect
                  value={selectedHostelForAnalytics}
                  onChange={setSelectedHostelForAnalytics}
                  className="w-full sm:w-auto sm:min-w-[190px] text-xs"
                  options={portalHostels.map(h => ({ value: h.id, label: h.name }))}
                />

                <div className="grid grid-cols-3 sm:inline-flex items-center bg-slate-100 border border-slate-200 p-1 rounded-xl text-xs font-medium w-full sm:w-auto">
                  {(['today', '7days', 'semester'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAnalyticsTimeframe(t)}
                      className={`px-3 py-1.5 rounded-lg transition capitalize whitespace-nowrap text-center ${
                        analyticsTimeframe === t
                          ? 'bg-[#0f3a98] text-[#ffbe00] shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t === '7days' ? '7 Days' : t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Metric KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500">Listing Views</span>
                  <span className="w-8 h-8 rounded-xl bg-[#edf2fc] text-[#0f3a98] flex items-center justify-center shrink-0">
                    <FaIcon icon="fa-solid fa-eye" className="text-xs" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-semibold text-[#0f3a98] tabular-nums">
                  {analyticsData?.views || 1420}
                </div>
                <div className="text-[11px] text-[#0f3a98] font-medium">Up 18% this week</div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500">WhatsApp Chats</span>
                  <span className="w-8 h-8 rounded-xl bg-[#fff8dc] text-[#0f3a98] border border-[#ffbe00]/50 flex items-center justify-center shrink-0">
                    <FaIcon icon="fa-brands fa-whatsapp" className="text-sm" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-semibold text-[#0f3a98] tabular-nums">
                  {analyticsData?.whatsAppTaps || 48}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">Direct student taps</div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500">Phone Calls</span>
                  <span className="w-8 h-8 rounded-xl bg-[#edf2fc] text-[#0f3a98] flex items-center justify-center shrink-0">
                    <FaIcon icon="fa-solid fa-phone" className="text-xs" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-semibold text-[#0f3a98] tabular-nums">
                  {analyticsData?.calls || 26}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">Direct call inquiries</div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500">Student Saves</span>
                  <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                    <FaIcon icon="fa-solid fa-heart" className="text-xs" />
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-semibold text-[#0f3a98] tabular-nums">
                  {analyticsData?.saves || 312}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">Added to shortlists</div>
              </div>
            </div>

            {/* Weekly Summary Banner */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0f3a98] border border-[#0f3a98] text-white flex flex-col items-center justify-center text-center gap-2.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-white/15 text-[#ffbe00] flex items-center justify-center shrink-0">
                <FaIcon icon="fa-solid fa-chart-line" className="text-sm" />
              </div>
              <div className="max-w-lg">
                <h4 className="font-semibold text-sm text-white">Weekly Performance Summary</h4>
                <p className="text-xs text-white/90 mt-1 font-medium leading-relaxed">
                  This listing received <strong className="text-white">{analyticsData?.views || 1420} views</strong> and{' '}
                  <strong className="text-white">{(analyticsData?.whatsAppTaps || 48) + (analyticsData?.calls || 26)} direct student enquiries</strong>.
                </p>
              </div>
            </div>

            {/* Broker Breakdown for Custodians */}
            {currentUser?.role === 'custodian' && (
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                <h3 className="text-base font-semibold text-[#0f3a98]">Broker Agent Activity</h3>
                <div className="space-y-2">
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <FaIcon icon="fa-solid fa-users" className="text-xs text-[#0f3a98]" />
                      <span className="font-medium text-slate-800">Brian Kigozi (Campus Scout)</span>
                      <span className="bg-[#ffbe00] text-[#0f3a98] px-2 py-0.5 rounded-md text-[10px] font-semibold">
                        Authorised
                      </span>
                    </div>
                    <div className="font-semibold text-[#0f3a98] whitespace-nowrap">22 Student Inquiries Driven</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CUSTODIAN SUBSCRIPTION & MOMO PAYMENT (Brokers join and list free) */}
        {activeTab === 'subscription' && currentUser?.role === 'custodian' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-medium text-[#0f3a98]">Custodian Semester Pass</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Semester subscriptions apply only to official hostel custodians. Brokers and students join free.
                  </p>
                </div>

                {subscription ? (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    subscription.status === 'active' ? 'bg-[#0f3a98] text-[#ffbe00]' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {subscription.isTrial ? 'Free Trial Active' : 'Semester Pass Active'}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#ffbe00] text-[#0f3a98]">
                    30-Day Free Trial
                  </span>
                )}
              </div>

              {paymentSuccessMsg && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#0f3a98] text-xs font-medium flex items-center gap-2">
                  <FaIcon icon="fa-solid fa-circle-check" className="text-[#0f3a98]" />
                  <span>{paymentSuccessMsg}</span>
                </div>
              )}

              {/* Plans Grid (Custodian plans only — brokers list for free) */}
              <div className="grid grid-cols-1 max-w-md gap-4 pt-2">
                {plans.filter(plan => plan.role === 'custodian').map(plan => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#0f3a98] bg-[#e8effc] ring-2 ring-[#0f3a98]'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-medium text-slate-500 uppercase">{plan.role}</div>
                        <h3 className="font-medium text-slate-900 text-base mt-1">{plan.name}</h3>
                        <div className="text-2xl font-medium text-[#0f3a98] mt-2">
                          {formatUGX(plan.priceUgx)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">per semester (120 days)</div>

                        <ul className="mt-4 space-y-1.5 text-xs text-slate-700 font-medium">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <FaIcon icon="fa-solid fa-circle-check" className="text-xs text-[#0f3a98] shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 text-center">
                        <span className={`text-xs font-medium ${isSelected ? 'text-[#0f3a98]' : 'text-slate-500'}`}>
                          {isSelected ? '✓ Plan Selected' : 'Tap to Select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* MTN MoMo & Airtel Money Checkout Form */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="font-medium text-[#0f3a98] text-base mb-1">
                  Pay via Mobile Money (MTN MoMo / Airtel Money)
                </h3>
                <p className="text-xs text-slate-500 mb-4 font-medium">
                  Aggregator instant push prompt simulation (Flutterwave / Pesapal / Yo! Payments)
                </p>

                <form onSubmit={handleProcessMomoPayment} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Payment Provider</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMomoProvider('mtn_momo')}
                        className={`p-2 rounded-lg border text-[11px] sm:text-xs font-medium whitespace-nowrap flex items-center justify-center gap-1.5 transition ${
                          momoProvider === 'mtn_momo'
                            ? 'border-[#ffbe00] bg-[#fff9e6] text-[#0f3a98] ring-2 ring-[#ffbe00]'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <img
                          src="/MTN%20mobile%20money.png"
                          alt="MTN MoMo"
                          className="h-4 sm:h-5 w-auto object-contain rounded-sm shrink-0"
                        />
                        <span className="whitespace-nowrap">MTN MoMo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMomoProvider('airtel_money')}
                        className={`p-2 rounded-lg border text-[11px] sm:text-xs font-medium whitespace-nowrap flex items-center justify-center gap-1.5 transition ${
                          momoProvider === 'airtel_money'
                            ? 'border-rose-400 bg-rose-50 text-rose-900 ring-2 ring-rose-400'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <img
                          src="/Airtel%20mobile%20money.jpg"
                          alt="Airtel Money"
                          className="w-4 h-4 sm:w-5 sm:h-5 object-cover rounded-sm shrink-0"
                        />
                        <span className="whitespace-nowrap">Airtel Money</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Mobile Money Number</label>
                    <input
                      type="text"
                      required
                      value={momoPhone}
                      onChange={e => setMomoPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-mono"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={paymentProcessing}
                      className="w-full py-2.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-[#ffbe00] text-xs font-medium shadow-sm transition"
                    >
                      {paymentProcessing ? 'Sending MoMo Prompt...' : 'Pay Subscription via MoMo'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ADD HOSTEL WITH DUPLICATE DETECTION */}
        {activeTab === 'add' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-1.5">
              <h2 className="text-xl font-medium text-[#0f3a98]">List a New Campus Hostel</h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {currentUser?.role === 'broker'
                  ? 'New broker uploads are sent for Admin approval before appearing in student search, and stay visible in your portal so you can edit details, photos, or videos anytime.'
                  : 'A hostel exists once per physical building. If an existing building matches your submission, you will attach as an offer.'}
              </p>
            </div>

            {duplicateWarning && (
              <div className="p-5 rounded-2xl bg-amber-50 border-2 border-[#ffbe00] space-y-4">
                <div className="flex items-start gap-3">
                  <FaIcon icon="fa-solid fa-triangle-exclamation" className="text-amber-700 text-lg shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-medium text-amber-950">
                      Duplicate Detected: Is this the same hostel? (Section 5)
                    </h3>
                    <p className="text-xs text-amber-900 mt-1 font-medium">
                      Our duplicate prevention engine detected high similarity with an existing registered building:
                    </p>
                    <ul className="mt-2 list-disc list-inside text-xs font-medium text-amber-950 space-y-1">
                      {duplicateWarning.matchReasons?.map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {duplicateWarning.matchedHostel && (
                  <div className="p-4 rounded-xl bg-white border border-amber-200 flex items-center gap-3">
                    <img
                      src={duplicateWarning.matchedHostel.photos[0]?.url}
                      alt="Match"
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                    <div>
                      <h4 className="font-medium text-sm text-slate-900">
                        {duplicateWarning.matchedHostel.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {duplicateWarning.matchedHostel.area} • {duplicateWarning.matchedHostel.campus}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2 border-t border-amber-200">
                  <p className="text-xs text-amber-950 font-medium">
                    If this is a brand new separate building, enter a reason for admin review:
                  </p>
                  <textarea
                    rows={2}
                    placeholder="Explain why this building is different..."
                    value={bypassReason}
                    onChange={e => setBypassReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98] bg-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDuplicateWarning(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-amber-100 hover:bg-amber-200"
                    >
                      Yes, it is the same (Cancel new)
                    </button>
                    <button
                      type="button"
                      disabled={!bypassReason.trim() || formSubmitting}
                      onClick={(e) => handleAddHostel(e, true)}
                      className="px-4 py-1.5 rounded-lg bg-[#0f3a98] text-[#ffbe00] text-xs font-medium shadow-sm transition disabled:opacity-50"
                    >
                      No, submit with reason for Admin Review
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={e => handleAddHostel(e, false)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Hostel Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Olympia Hostel Kikoni"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0f3a98]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">University Campus</label>
                  <BoundedSelect
                    value={formCampus}
                    onChange={setFormCampus}
                    className="text-sm"
                    options={[
                      { value: 'Makerere University', label: 'Makerere University' },
                      { value: 'MUBS', label: 'MUBS' },
                      { value: 'Kyambogo University', label: 'Kyambogo University' },
                      { value: 'Uganda Christian University', label: 'Uganda Christian University' },
                      { value: 'KIU', label: 'KIU' },
                    ]}
                  />
                </div>
              </div>

              <HostelLocationFinder
                hostelName={formName}
                campus={formCampus}
                lat={formLat}
                lng={formLng}
                distanceLabel={formDistance}
                autoLookupOnTyping
                onApplyLocation={({ lat: nextLat, lng: nextLng, distanceLabel, area, address, landmark }) => {
                  setFormLat(String(nextLat));
                  setFormLng(String(nextLng));
                  setFormDistance(distanceLabel);
                  if (area) setFormArea(area);
                  if (address) setFormAddress(address);
                  if (landmark) setFormLandmark(landmark);
                }}
                onDistanceTextChange={setFormDistance}
              />

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe amenities, backup power, water reservoirs, security, distance..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Area / Neighborhood</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kikoni"
                    value={formArea}
                    onChange={e => setFormArea(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Prominent Landmark</label>
                  <input
                    type="text"
                    placeholder="e.g. Caltec Academy"
                    value={formLandmark}
                    onChange={e => setFormLandmark(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Room Offering & Rates */}
              <div className="p-4 rounded-xl bg-[#edf2fc]/70 border border-blue-100 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#0f3a98]">
                      Room Types Available at This Hostel
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Upload Single rooms alone, Double rooms alone, or both (each appears on its own card).
                    </p>
                  </div>
                  <div className="inline-flex rounded-xl bg-white p-1 border border-blue-200 gap-1 self-start">
                    {[
                      { value: 'both', label: 'Single & Double' },
                      { value: 'single_only', label: 'Single Only' },
                      { value: 'double_only', label: 'Double Only' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormRoomOffering(opt.value as 'both' | 'single_only' | 'double_only')}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition whitespace-nowrap ${
                          formRoomOffering === opt.value
                            ? 'bg-[#0f3a98] text-white shadow-sm'
                            : 'text-slate-600 hover:text-[#0f3a98] hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(formRoomOffering === 'both' || formRoomOffering === 'single_only') && (
                    <div className="p-3 rounded-xl bg-white border border-blue-100 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#0f3a98]">Single Room Details</span>
                        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[10px] font-semibold">
                          <button
                            type="button"
                            onClick={() => setFormSingleStyle('single')}
                            className={`px-2 py-0.5 rounded-md transition ${
                              formSingleStyle === 'single' ? 'bg-[#0f3a98] text-white' : 'text-slate-600'
                            }`}
                          >
                            Single Room
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormSingleStyle('self_contained_single')}
                            className={`px-2 py-0.5 rounded-md transition ${
                              formSingleStyle === 'self_contained_single' ? 'bg-[#0f3a98] text-white' : 'text-slate-600'
                            }`}
                          >
                            Self-Contained
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Rent / Sem (UGX)</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={formSingleRent}
                            onChange={e => setFormSingleRent(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Vacant</label>
                          <input
                            type="number"
                            min="0"
                            value={formSingleAvailable}
                            onChange={e => setFormSingleAvailable(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 font-medium text-center"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(formRoomOffering === 'both' || formRoomOffering === 'double_only') && (
                    <div className="p-3 rounded-xl bg-white border border-blue-100 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#0f3a98]">Double Room Details</span>
                        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[10px] font-semibold">
                          <button
                            type="button"
                            onClick={() => setFormDoubleStyle('double')}
                            className={`px-2 py-0.5 rounded-md transition ${
                              formDoubleStyle === 'double' ? 'bg-[#0f3a98] text-white' : 'text-slate-600'
                            }`}
                          >
                            Double Room
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormDoubleStyle('self_contained_double')}
                            className={`px-2 py-0.5 rounded-md transition ${
                              formDoubleStyle === 'self_contained_double' ? 'bg-[#0f3a98] text-white' : 'text-slate-600'
                            }`}
                          >
                            Self-Contained
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Rent / Sem (UGX)</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={formDoubleRent}
                            onChange={e => setFormDoubleRent(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Vacant</label>
                          <input
                            type="number"
                            min="0"
                            value={formDoubleAvailable}
                            onChange={e => setFormDoubleAvailable(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 font-medium text-center"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {currentUser?.role !== 'custodian' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Broker Inspection Fee (UGX)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0 or positive UGX"
                      value={formAccessFee}
                      onChange={e => setFormAccessFee(e.target.value)}
                      className="w-full sm:max-w-xs px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Hostel Photos & Videos Uploader */}
              <HostelMediaEditor items={formMedia} onChange={setFormMedia} />

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-3 rounded-xl bg-[#0f3a98] hover:bg-[#0a2666] text-[#ffbe00] font-medium text-sm shadow-md transition"
              >
                {formSubmitting ? 'Running Duplicate Checks...' : 'Verify & Publish Listing'}
              </button>
            </form>
          </div>
        )}
        </>
        )}

      </main>

      {/* Edit Hostel Details, Photos & Videos Modal */}
      {editingHostel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans">
          <div className="bg-white w-full sm:max-w-2xl rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="relative px-10 py-5 bg-[#0f3a98] text-white text-center flex flex-col items-center justify-center">
              <h3 className="font-semibold text-base sm:text-lg leading-tight">
                Edit All Hostel Details — {editingHostel.name}
              </h3>
              <p className="text-[11px] text-blue-100 mt-1 max-w-md mx-auto">
                Modify name, campus, location, amenities, rates, fees, photos, and videos
              </p>
              <button
                type="button"
                onClick={() => setEditingHostel(null)}
                aria-label="Close editor"
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition absolute right-3.5 top-3.5"
              >
                <FaIcon icon="fa-solid fa-xmark" className="text-xs" />
              </button>
            </div>

            <form onSubmit={handleSaveHostelEdit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Hostel Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0f3a98]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">University Campus</label>
                  <BoundedSelect
                    value={editCampus}
                    onChange={setEditCampus}
                    className="text-sm"
                    options={[
                      { value: 'Makerere University', label: 'Makerere University' },
                      { value: 'MUBS', label: 'MUBS' },
                      { value: 'Kyambogo University', label: 'Kyambogo University' },
                      { value: 'Uganda Christian University', label: 'Uganda Christian University' },
                      { value: 'KIU', label: 'KIU' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Area</label>
                  <input
                    type="text"
                    required
                    value={editArea}
                    onChange={e => setEditArea(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Landmark</label>
                  <input
                    type="text"
                    value={editLandmark}
                    onChange={e => setEditLandmark(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Gender Policy</label>
                  <BoundedSelect<'mixed' | 'girls_only' | 'boys_only'>
                    value={editGender}
                    onChange={setEditGender}
                    className="text-sm"
                    options={[
                      { value: 'mixed', label: 'Mixed' },
                      { value: 'girls_only', label: 'Girls Only' },
                      { value: 'boys_only', label: 'Boys Only' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Street / Address</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Campus Distance</label>
                  <input
                    type="text"
                    value={editDistance}
                    onChange={e => setEditDistance(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <HostelLocationFinder
                hostelName={editName}
                campus={editCampus}
                lat={editLat}
                lng={editLng}
                distanceLabel={editDistance}
                onApplyLocation={({ lat: nextLat, lng: nextLng, distanceLabel, area, address, landmark }) => {
                  setEditLat(String(nextLat));
                  setEditLng(String(nextLng));
                  setEditDistance(distanceLabel);
                  if (area) setEditArea(area);
                  if (address) setEditAddress(address);
                  if (landmark) setEditLandmark(landmark);
                }}
                onDistanceTextChange={setEditDistance}
              />

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                />
              </div>

              {/* Editable Amenities Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">Hostel Amenities</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'water', label: '24/7 Water', icon: 'fa-solid fa-droplet' },
                    { id: 'security', label: '24/7 Security', icon: 'fa-solid fa-shield-halved' },
                    { id: 'wifi', label: 'WiFi', icon: 'fa-solid fa-wifi' },
                    { id: 'power_backup', label: 'Generator / Solar', icon: 'fa-solid fa-bolt' },
                    { id: 'meals', label: 'Meals / Canteen', icon: 'fa-solid fa-utensils' },
                    { id: 'shuttle', label: 'Campus Shuttle', icon: 'fa-solid fa-van-shuttle' },
                    { id: 'gym', label: 'Gym', icon: 'fa-solid fa-dumbbell' },
                  ].map(amenity => {
                    const selected = editAmenities.includes(amenity.id);
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() =>
                          setEditAmenities(prev =>
                            selected ? prev.filter(a => a !== amenity.id) : [...prev, amenity.id]
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition ${
                          selected
                            ? 'bg-[#0f3a98] border-[#0f3a98] text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-[#0f3a98]/40'
                        }`}
                      >
                        <FaIcon
                          icon={amenity.icon}
                          className={`text-[10px] ${selected ? 'text-[#ffbe00]' : 'text-slate-400'}`}
                        />
                        <span>{amenity.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {currentUser?.role === 'broker' && (
                <div className="p-4 rounded-xl bg-[#0f3a98] border border-[#0f3a98] text-white space-y-2 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-white">
                      Your Broker Inspection Price (UGX)
                    </label>
                    <span className="text-[11px] font-medium text-white/90">
                      Shown to students when booking inspection
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={editAccessFee}
                    onChange={e => setEditAccessFee(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-white/25 bg-white font-semibold text-[#0f3a98]"
                  />
                </div>
              )}

              {(currentUser?.role === 'custodian' || editingHostel.status === 'unclaimed') ? (
                <div className="p-3.5 rounded-xl bg-[#edf2fc]/70 border border-blue-100 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#0f3a98]">Room Rates &amp; Availability</span>
                      <span className="px-2 py-0.5 rounded-full bg-white text-[#0f3a98] text-[10px] font-semibold border border-blue-200">
                        {getRoomOfferingSummary(editRooms).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setEditRooms(prev => [
                            ...prev,
                            {
                              id: `rm_${editingHostel.id}_${Date.now()}`,
                              hostelId: editingHostel.id,
                              name: 'Single Room',
                              type: 'single',
                              rentUgx: 1100000,
                              roomsTotal: 20,
                              roomsAvailable: 5,
                              updatedAt: new Date().toISOString(),
                              updatedBy: currentUser?.id || 'seller',
                            },
                          ])
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0f3a98] text-white text-[11px] font-medium hover:bg-[#0a2666] transition"
                      >
                        <FaIcon icon="fa-solid fa-plus" className="text-[9px]" />
                        <span>Single Room</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditRooms(prev => [
                            ...prev,
                            {
                              id: `rm_${editingHostel.id}_${Date.now()}_d`,
                              hostelId: editingHostel.id,
                              name: 'Double Room',
                              type: 'double',
                              rentUgx: 800000,
                              roomsTotal: 30,
                              roomsAvailable: 8,
                              updatedAt: new Date().toISOString(),
                              updatedBy: currentUser?.id || 'seller',
                            },
                          ])
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-[#0f3a98] border border-blue-200 text-[11px] font-medium hover:bg-blue-50 transition"
                      >
                        <FaIcon icon="fa-solid fa-plus" className="text-[9px]" />
                        <span>Double Room</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {editRooms.map((room, rIdx) => (
                      <div key={room.id} className="grid grid-cols-12 gap-1.5 items-center bg-white p-2 rounded-lg border border-blue-100 text-xs">
                        <div className="col-span-12 sm:col-span-3">
                          <BoundedSelect
                            value={room.type}
                            onChange={(val) =>
                              setEditRooms(prev =>
                                prev.map((r, i) =>
                                  i === rIdx
                                    ? {
                                        ...r,
                                        type: val as Hostel['rooms'][number]['type'],
                                      }
                                    : r
                                )
                              )
                            }
                            options={[
                              { value: 'single', label: 'Single Room' },
                              { value: 'self_contained_single', label: 'Single Self-Contained' },
                              { value: 'double', label: 'Double Room' },
                              { value: 'self_contained_double', label: 'Double Self-Contained' },
                              { value: 'triple', label: 'Triple' },
                              { value: 'quad', label: 'Quad' },
                            ]}
                            buttonClassName="px-2 py-1 rounded border border-slate-200 text-[11px] font-medium"
                          />
                        </div>
                        <input
                          type="text"
                          value={room.name}
                          onChange={e => setEditRooms(prev => prev.map((r, i) => i === rIdx ? { ...r, name: e.target.value } : r))}
                          placeholder="Room label"
                          className="col-span-5 sm:col-span-4 px-2 py-1 rounded border border-slate-200 font-medium"
                        />
                        <input
                          type="number"
                          value={room.rentUgx}
                          onChange={e => setEditRooms(prev => prev.map((r, i) => i === rIdx ? { ...r, rentUgx: parseInt(e.target.value) || 0 } : r))}
                          className="col-span-4 sm:col-span-3 px-2 py-1 rounded border border-slate-200 font-medium"
                          title="Rent (UGX)"
                        />
                        <input
                          type="number"
                          min="0"
                          value={room.roomsAvailable}
                          onChange={e => setEditRooms(prev => prev.map((r, i) => i === rIdx ? { ...r, roomsAvailable: parseInt(e.target.value) || 0 } : r))}
                          className="col-span-2 sm:col-span-1 px-1.5 py-1 rounded border border-slate-200 font-medium text-center"
                          title="Vacant rooms"
                        />
                        <button
                          type="button"
                          disabled={editRooms.length <= 1}
                          onClick={() => setEditRooms(prev => prev.filter((_, i) => i !== rIdx))}
                          title="Remove room row"
                          className="col-span-1 flex items-center justify-center text-slate-400 hover:text-red-600 disabled:opacity-30 transition"
                        >
                          <FaIcon icon="fa-solid fa-trash" className="text-[11px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                  <FaIcon icon="fa-solid fa-lock" className="text-[#0f3a98] text-xs shrink-0" />
                  <span>
                    Semester room rates &amp; vacancy on this claimed building are set by its verified Custodian. You can still edit description, location, amenities, inspection fee, photos, and videos above.
                  </span>
                </div>
              )}

              {/* Full Photo & Video Gallery Editor */}
              <HostelMediaEditor items={editMedia} onChange={setEditMedia} />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingHostel(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 rounded-xl bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                >
                  <FaIcon icon="fa-solid fa-check" className="text-xs text-[#ffbe00]" />
                  <span>{editSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {avatarModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="relative px-8 py-4 bg-[#0f3a98] text-white text-center">
              <h3 className="text-sm sm:text-base font-semibold text-white">
                {currentUser.avatarUrl ? 'Edit Profile Photo' : 'Add Profile Photo'}
              </h3>
              <p className="text-[11px] text-blue-100 mt-0.5">
                Students see this photo when booking your inspections
              </p>
              <button
                type="button"
                onClick={() => setAvatarModalOpen(false)}
                aria-label="Close modal"
                className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition"
              >
                <FaIcon icon="fa-solid fa-xmark" className="text-xs" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Circular Booking Preview */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-24 h-24">
                  <div className="w-24 h-24 rounded-full border-2 border-[#0f3a98] ring-4 ring-[#edf2fc] bg-[#edf2fc] overflow-hidden flex items-center justify-center shadow-sm">
                    {avatarDraft.trim() ? (
                      <img
                        src={avatarDraft.trim()}
                        alt={currentUser.name}
                        onError={() => setAvatarError('Could not load that image URL. Try uploading from your device.')}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-semibold text-[#0f3a98]">
                        {(currentUser.name || 'HC')
                          .split(' ')
                          .map(n => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full bg-[#0f3a98] border-2 border-white flex items-center justify-center text-[10px] text-[#ffbe00]">
                    <FaIcon icon="fa-solid fa-check" />
                  </span>
                </div>
                <span className="text-xs font-semibold text-[#0f3a98] text-center">
                  {currentUser.businessName || currentUser.name}
                </span>
              </div>

              {/* Upload Photo from Device */}
              <label className="w-full py-2.5 px-4 rounded-xl bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition shadow-sm">
                <FaIcon icon="fa-solid fa-cloud-arrow-up" className="text-[#ffbe00]" />
                <span>Upload Photo from Device</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setAvatarError('');
                    if (file.size > 10 * 1024 * 1024) {
                      setAvatarError('Image exceeds 10MB. Please choose a smaller photo.');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const rawUrl = typeof reader.result === 'string' ? reader.result : '';
                      if (!rawUrl) return;
                      const img = new Image();
                      img.onload = () => {
                        const maxSide = 400;
                        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
                        const canvas = document.createElement('canvas');
                        canvas.width = Math.max(1, Math.round(img.width * scale));
                        canvas.height = Math.max(1, Math.round(img.height * scale));
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                          setAvatarDraft(canvas.toDataURL('image/jpeg', 0.85));
                        } else {
                          setAvatarDraft(rawUrl);
                        }
                      };
                      img.onerror = () => setAvatarDraft(rawUrl);
                      img.src = rawUrl;
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
              </label>

              {/* Or Paste Image URL */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1 text-center">
                  Or paste a profile photo URL
                </label>
                <input
                  type="text"
                  value={avatarDraft}
                  onChange={e => {
                    setAvatarError('');
                    setAvatarDraft(e.target.value);
                  }}
                  placeholder="https://example.com/my-photo.jpg"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f3a98]"
                />
              </div>

              {avatarError && (
                <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 text-center font-medium">
                  {avatarError}
                </p>
              )}

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                {currentUser.avatarUrl ? (
                  <button
                    type="button"
                    disabled={avatarSaving}
                    onClick={async () => {
                      setAvatarSaving(true);
                      const res = await updateUserProfile({ avatarUrl: '' });
                      setAvatarSaving(false);
                      if (res.success) {
                        setOffers(prev =>
                          prev.map(o =>
                            o.userId === currentUser.id ? { ...o, avatarUrl: '' } : o
                          )
                        );
                        setUpdateMsg('Profile photo removed.');
                        setTimeout(() => setUpdateMsg(''), 3500);
                        setAvatarModalOpen(false);
                      } else {
                        setAvatarError(res.error || 'Could not remove photo.');
                      }
                    }}
                    className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition disabled:opacity-50"
                  >
                    Remove
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAvatarModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={avatarSaving || !avatarDraft.trim()}
                    onClick={async () => {
                      const nextUrl = avatarDraft.trim();
                      if (!nextUrl) return;
                      setAvatarSaving(true);
                      setAvatarError('');
                      const res = await updateUserProfile({ avatarUrl: nextUrl });
                      setAvatarSaving(false);
                      if (res.success) {
                        setOffers(prev =>
                          prev.map(o =>
                            o.userId === currentUser.id ? { ...o, avatarUrl: nextUrl } : o
                          )
                        );
                        setUpdateMsg('Profile photo saved and synced across all your booking listings!');
                        setTimeout(() => setUpdateMsg(''), 4000);
                        setAvatarModalOpen(false);
                      } else {
                        setAvatarError(res.error || 'Failed to save profile photo.');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0f3a98] hover:bg-[#0a2666] text-[#ffbe00] text-xs font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    {avatarSaving ? 'Saving...' : 'Save Photo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
      />

      <Footer />
    </div>
  );
}

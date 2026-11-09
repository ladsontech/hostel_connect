'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ContactModal from '@/components/ContactModal';
import AuthModal from '@/components/AuthModal';
import { Hostel, Offer, Review } from '@/types';
import { formatUGX, formatDateEAT } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Award, 
  PhoneCall, 
  Wifi, 
  Zap, 
  Droplet, 
  Bus, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare, 
  Lock,
  Share2,
  Heart
} from 'lucide-react';

export default function HostelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hostelId = params?.id as string;
  const { currentUser, isAuthenticated } = useAuth();

  const [hostel, setHostel] = useState<Hostel | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('wrong_price');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Review submission
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/hostels/${hostelId}`);
      const data = await res.json();
      if (data.success) {
        setHostel(data.hostel);
        setOffers(data.offers);
        setReviews(data.reviews);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hostelId) {
      loadData();
    }
  }, [hostelId]);

  const handleOpenContact = () => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    setIsContactOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    setReviewSubmitting(true);
    setReviewMsg('');

    // Simulate review creation and approval
    const newRev: Review = {
      id: `rev_${Date.now()}`,
      hostelId,
      studentId: currentUser.id,
      studentName: currentUser.name,
      rating: newRating,
      text: newReviewText,
      status: 'approved',
      createdAt: new Date().toISOString()
    };

    setTimeout(() => {
      setReviews(prev => [newRev, ...prev]);
      setReviewSubmitting(false);
      setNewReviewText('');
      setReviewMsg('Thank you! Your review has been published.');
    }, 500);
  };

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSuccess(true);
    setTimeout(() => {
      setIsReportOpen(false);
      setReportSuccess(false);
      setReportDetails('');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar onOpenAuth={() => setIsAuthOpen(true)} />
        <div className="max-w-6xl mx-auto w-full p-6 animate-pulse space-y-4">
          <div className="h-8 w-48 bg-slate-200 rounded"></div>
          <div className="h-96 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar onOpenAuth={() => setIsAuthOpen(true)} />
        <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border text-center space-y-4">
          <h2 className="text-xl font-bold">Hostel not found</h2>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const photos = hostel.photos.length > 0 ? hostel.photos : [
    { id: '1', url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80', caption: 'Hostel View', isCover: true, order: 1 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onOpenAuth={() => setIsAuthOpen(true)} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        
        {/* Top Back bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Hostels
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReportOpen(true)}
              className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Report Listing
            </button>
          </div>
        </div>

        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-[16/9] md:aspect-[21/9] w-full rounded-2xl overflow-hidden bg-slate-900 shadow-md">
            <img
              src={photos[selectedPhotoIndex]?.url || photos[0].url}
              alt={hostel.name}
              className="w-full h-full object-cover"
            />

            {/* Badges on main image */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {hostel.status === 'claimed' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-md">
                  <ShieldCheck className="w-4 h-4" />
                  Custodian Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white shadow-md">
                  Agent Listed
                </span>
              )}
            </div>

            <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-lg font-medium">
              Photo {selectedPhotoIndex + 1} of {photos.length}
            </div>
          </div>

          {/* Thumbnails row */}
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                    selectedPhotoIndex === idx ? 'border-emerald-600 ring-2 ring-emerald-400' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={p.url} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title, Campus & Location summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md w-fit mb-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{hostel.campus} • {hostel.area}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{hostel.name}</h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span>{hostel.distanceCampusApprox}</span>
                <span>•</span>
                <span>Landmark: {hostel.landmark}</span>
              </p>
            </div>

            {/* Quick Contact CTA */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-right">
                <div className="text-[11px] text-slate-400 font-bold uppercase">Direct Inquiry</div>
                <div className="text-emerald-700 font-extrabold text-sm sm:text-base">
                  {offers.length} Active Contact{offers.length === 1 ? '' : 's'}
                </div>
              </div>
              <button
                onClick={handleOpenContact}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition"
              >
                <PhoneCall className="w-4 h-4" />
                Reveal Phone & WhatsApp
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed pt-2 border-t border-slate-100">
            {hostel.description}
          </p>
        </div>

        {/* Room Types & Live Availability (BR-1: Owned by Custodian) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Room Types & Semester Rates</h3>
              <p className="text-xs text-slate-500">Official rents set directly by hostel management</p>
            </div>
            <div className="text-xs text-slate-400">
              Updated: {formatDateEAT(hostel.lastAvailabilityConfirmedAt)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hostel.rooms.map(room => (
              <div
                key={room.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{room.name}</h4>
                    {room.roomsAvailable > 0 ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {room.roomsAvailable} Left
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                        Full
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 capitalize">
                    {room.type.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Per Semester</span>
                  <span className="font-extrabold text-emerald-700 text-lg">
                    {formatUGX(room.rentUgx)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Amenities Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">Amenities & Facilities</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { id: 'water', label: 'Constant Water Supply', icon: Droplet },
              { id: 'power_backup', label: 'Standby Generator', icon: Zap },
              { id: 'wifi', label: 'Fast Campus WiFi', icon: Wifi },
              { id: 'security', label: '24/7 Guard & CCTV' },
              { id: 'shuttle', label: 'Campus Shuttle Bus', icon: Bus },
              { id: 'meals', label: 'Cafeteria / Dining Hall' },
              { id: 'gym', label: 'Fitness Center' }
            ].map(item => {
              const present = hostel.amenities.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-center gap-2 ${
                    present
                      ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900 font-semibold'
                      : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60'
                  }`}
                >
                  <CheckCircle className={`w-4 h-4 ${present ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exact Location & Privacy Protection Notice (FR-2.6) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">Hostel Address & Directions</h3>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs text-slate-800">
                Privacy Protection Active (FR-2.6)
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Approximate location: <strong>{hostel.distanceCampusApprox}</strong>.
                Exact building gate pin and direct manager phone numbers are revealed once you tap Contact and are signed in with your phone.
              </p>
              <button
                onClick={handleOpenContact}
                className="mt-2 text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
              >
                Tap to reveal contact offers →
              </button>
            </div>
          </div>
        </div>

        {/* Student Reviews & Ratings (FR-7.1) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Student Reviews & Ratings</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center text-amber-600 font-bold">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  {hostel.ratingAvg.toFixed(1)} / 5.0
                </span>
                <span>•</span>
                <span>{reviews.length} reviews</span>
              </div>
            </div>
          </div>

          {/* Reviews list */}
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500">No reviews yet for this hostel.</p>
            ) : (
              reviews.map(rev => (
                <div key={rev.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{rev.studentName}</span>
                    <div className="flex items-center text-amber-500">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= rev.rating ? 'fill-current' : 'text-slate-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-700">{rev.text}</p>
                  {rev.sellerReply && (
                    <div className="mt-2 pl-3 border-l-2 border-emerald-500 text-xs text-slate-600 bg-white p-2 rounded">
                      <span className="font-bold text-emerald-800">Hostel Response: </span>
                      {rev.sellerReply}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Submit Review Form */}
          <form onSubmit={handleSubmitReview} className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-800">Leave a Review (Students Only - BR-7)</h4>
            {reviewMsg && (
              <div className="p-2.5 rounded bg-emerald-50 text-emerald-800 text-xs font-medium">
                {reviewMsg}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Your Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setNewRating(s)}
                    className="p-1 text-amber-400 hover:scale-110 transition"
                  >
                    <Star className={`w-4 h-4 ${s <= newRating ? 'fill-current' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              required
              rows={2}
              placeholder="Share your experience (power, water, distance, custodian responsiveness...)"
              value={newReviewText}
              onChange={e => setNewReviewText(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={reviewSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-sm transition"
            >
              {reviewSubmitting ? 'Posting...' : 'Post Student Review'}
            </button>
          </form>
        </div>

      </main>

      {/* Contact Drawer Modal */}
      <ContactModal
        hostel={hostel}
        offers={offers}
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        onRequireAuth={() => setIsAuthOpen(true)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Report Modal (FR-7.3) */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border shadow-xl">
            <h3 className="font-bold text-slate-900 text-base">Report Listing (FR-7.3)</h3>
            {reportSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold">
                Thank you. Report submitted to the admin moderation queue.
              </div>
            ) : (
              <form onSubmit={handleReport} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label>
                  <select
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-xs"
                  >
                    <option value="fake_listing">Fake or non-existent listing</option>
                    <option value="wrong_price">Wrong price or misleading rent</option>
                    <option value="wrong_photos">Photos don't match building</option>
                    <option value="already_taken">Already full / taken</option>
                    <option value="duplicate">Duplicate building listing</option>
                    <option value="scam">Scam / fraudulent agent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Details</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details for our verification team..."
                    value={reportDetails}
                    onChange={e => setReportDetails(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

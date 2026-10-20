import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Plus,
  Check,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Link } from '../../lib/router/RouterContext';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { AddressService, CreateAddressInput } from '../../services/address.service';
import { Address } from '../../types/ecommerce';

export const AddressesPage: React.FC = () => {
  const { user, profile } = useAuth();
  const userId = user?.id || profile?.id || 'usr_guest_demo';

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Address form fields
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [apartmentSuite, setApartmentSuite] = useState('');
  const [city, setCity] = useState('Lagos');
  const [stateProvince, setStateProvince] = useState('Lagos State');
  const [postalCode, setPostalCode] = useState('101233');
  const [country, setCountry] = useState('Nigeria');
  const [isDefault, setIsDefault] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const list = await AddressService.getUserAddresses(userId);
      setAddresses(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [userId]);

  const resetForm = () => {
    setEditingAddressId(null);
    setShowForm(false);
    setRecipientName(profile?.display_name || '');
    setPhone(profile?.phone_number || '+234 803 123 4567');
    setStreetAddress('');
    setApartmentSuite('');
    setCity('Lagos');
    setStateProvince('Lagos State');
    setPostalCode('101233');
    setCountry('Nigeria');
    setIsDefault(false);
    setFormError(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (addr: Address) => {
    setEditingAddressId(addr.id);
    setRecipientName(addr.recipient_name);
    setPhone(addr.phone);
    setStreetAddress(addr.street_address);
    setApartmentSuite(addr.apartment_suite || '');
    setCity(addr.city);
    setStateProvince(addr.state_province || '');
    setPostalCode(addr.postal_code || '');
    setCountry(addr.country || 'Nigeria');
    setIsDefault(addr.is_default_shipping);
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!recipientName.trim() || !phone.trim() || !streetAddress.trim() || !city.trim()) {
      setFormError('Recipient name, phone number, street address, and city are required.');
      return;
    }

    const payload: CreateAddressInput = {
      recipient_name: recipientName.trim(),
      phone: phone.trim(),
      street_address: streetAddress.trim(),
      apartment_suite: apartmentSuite.trim() || null,
      city: city.trim(),
      state_province: stateProvince.trim() || null,
      postal_code: postalCode.trim() || '101233',
      country: country.trim() || 'Nigeria',
      is_default_shipping: isDefault || addresses.length === 0,
      is_default_billing: isDefault || addresses.length === 0,
    };

    setIsSubmitting(true);
    try {
      if (editingAddressId) {
        const updated = await AddressService.updateAddress(userId, editingAddressId, payload);
        if (updated) {
          setSuccessMessage('Delivery address updated successfully.');
          await loadAddresses();
          resetForm();
        } else {
          setFormError('Failed to update address. Please check your inputs.');
        }
      } else {
        const created = await AddressService.createAddress(userId, payload);
        if (created) {
          setSuccessMessage('New delivery destination added successfully.');
          await loadAddresses();
          resetForm();
        } else {
          setFormError('Failed to save address.');
        }
      }
    } catch (err: any) {
      setFormError(err?.message || 'An unexpected error occurred while saving the address.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    await AddressService.setDefaultShipping(userId, addressId);
    setSuccessMessage('Default delivery address updated.');
    await loadAddresses();
  };

  const handleDelete = async (addressId: string) => {
    if (!window.confirm('Are you sure you want to remove this delivery address?')) {
      return;
    }
    await AddressService.deleteAddress(userId, addressId);
    setAddresses((prev) => prev.filter((a) => a.id !== addressId));
    setSuccessMessage('Address removed.');
  };

  return (
    <div id="customer-addresses-page" className="space-y-8 pb-12">
      {/* Header & Breadcrumb */}
      <div>
        <Link
          to="/account"
          id="btn-back-to-account-addresses"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Account</span>
        </Link>

        <div className="border-b border-zinc-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-serif tracking-widest text-amber-400 font-semibold">
              Delivery Logistics
            </span>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-100 mt-1">
              Delivery Addresses
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Saved fitting salons, residences, and concierge destinations for tailored garment deliveries.
            </p>
          </div>

          <Button
            size="sm"
            id="btn-toggle-add-address"
            onClick={showForm ? resetForm : openAddForm}
            leftIcon={showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          >
            {showForm ? 'Close Form' : 'Add New Address'}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          id="address-success-banner"
          className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Address Form (Add or Edit) */}
      {showForm && (
        <form
          id="address-entry-form"
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-5 max-w-2xl shadow-xl animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="border-b border-zinc-800/80 pb-3 flex items-center justify-between">
            <h3 className="font-serif text-sm font-semibold text-zinc-100">
              {editingAddressId ? 'Edit Delivery Destination' : 'Add New Delivery Destination'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-zinc-400 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">
                Recipient Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Adewale Adeleke"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">
                Phone Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="+234 803 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium block">
              Street Address <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 14 Alexander Avenue, Ikoyi"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">
                Suite / Unit / Landmark
              </label>
              <input
                type="text"
                placeholder="e.g. Penthouse B, Near Church"
                value={apartmentSuite}
                onChange={(e) => setApartmentSuite(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">
                City <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lagos, Abuja"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">State / Region</label>
              <input
                type="text"
                placeholder="e.g. Lagos State, FCT"
                value={stateProvince}
                onChange={(e) => setStateProvince(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">Postal / Zip Code</label>
              <input
                type="text"
                placeholder="101233"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">Country</label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDefaultCheck"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="isDefaultCheck" className="text-xs text-zinc-300 select-none cursor-pointer">
              Set as default shipping destination
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button size="sm" variant="secondary" onClick={resetForm} type="button">
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={isSubmitting} id="btn-save-address">
              {isSubmitting ? 'Saving Address...' : editingAddressId ? 'Update Address' : 'Save Destination'}
            </Button>
          </div>
        </form>
      )}

      {/* Address List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-500">
          Loading saved addresses...
        </div>
      ) : addresses.length === 0 ? (
        <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 text-center space-y-3">
          <MapPin className="w-8 h-8 text-amber-400/50 mx-auto" />
          <p className="text-sm font-medium text-zinc-300">No delivery destinations registered</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Add your primary residence, atelier, or fitting salon for delivery of tailored garments.
          </p>
          <Button size="sm" onClick={openAddForm} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add First Destination
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              id={`address-card-${addr.id}`}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition ${
                addr.is_default_shipping
                  ? 'bg-zinc-900/60 border-amber-500/30'
                  : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-serif text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">{addr.recipient_name}</span>
                  </span>

                  {addr.is_default_shipping ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3" /> Default Destination
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[11px] text-zinc-500 hover:text-amber-400 transition cursor-pointer shrink-0"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <p className="text-xs text-zinc-300 font-medium">{addr.phone}</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {addr.street_address}
                  {addr.apartment_suite && <span>, {addr.apartment_suite}</span>}
                  <br />
                  {addr.city}
                  {addr.state_province ? `, ${addr.state_province}` : ''}, {addr.country}
                  {addr.postal_code ? ` (${addr.postal_code})` : ''}
                </p>
              </div>

              {/* Actions row: Edit and Delete */}
              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                <button
                  onClick={() => openEditForm(addr)}
                  className="text-zinc-400 hover:text-zinc-200 transition cursor-pointer flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-zinc-500 hover:text-rose-400 transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

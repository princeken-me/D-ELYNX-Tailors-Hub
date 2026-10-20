import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Heart,
  ShieldCheck,
  CheckCircle2,
  X,
  MapPin,
  AlertCircle,
  Clock,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useRouter } from '../../lib/router/RouterContext';
import { EmptyState } from '../../components/feedback/EmptyState';
import { AddressService } from '../../services/address.service';
import { OrderService } from '../../services/order.service';
import { Address, Order } from '../../types/ecommerce';

export const CartPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const userId = user?.id || profile?.id || 'usr_guest_demo';

  const { cart, subtotal, updateQuantity, removeItem, clearCart, isSyncing } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Quick address add state inside checkout
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newRecipient, setNewRecipient] = useState(profile?.display_name || 'Adewale Adeleke');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('Lagos');
  const [newPhone, setNewPhone] = useState('+234 803 123 4567');
  const [newPostalCode, setNewPostalCode] = useState('101233');

  // Submission & Confirmation state
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  const cartCurrency = cart.currency || cart.items[0]?.product?.currency || 'NGN';
  const locale = cartCurrency === 'NGN' ? 'en-NG' : 'en-US';

  const formattedSubtotal = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: cartCurrency,
    maximumFractionDigits: 0,
  }).format(subtotal);

  // Standard Nigerian 7.5% VAT calculation
  const estimatedShipping = 0; // Complimentary luxury delivery
  const estimatedTax = subtotal > 0 ? Math.round(subtotal * 0.075) : 0;
  const estimatedTotal = subtotal + estimatedShipping + estimatedTax;

  const formattedTotal = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: cartCurrency,
    maximumFractionDigits: 0,
  }).format(estimatedTotal);

  const formattedTax = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: cartCurrency,
    maximumFractionDigits: 0,
  }).format(estimatedTax);

  // Load customer addresses when checkout opens
  useEffect(() => {
    if (isCheckoutOpen) {
      setLoadingAddresses(true);
      setOrderError(null);
      setIdempotencyKey(`idem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);

      AddressService.getUserAddresses(userId)
        .then((list) => {
          setAddresses(list);
          if (list.length > 0) {
            const defaultAddr = list.find((a) => a.is_default_shipping) || list[0];
            setSelectedAddressId(defaultAddr.id);
          } else {
            setShowNewAddressForm(true);
          }
        })
        .finally(() => {
          setLoadingAddresses(false);
        });
    }
  }, [isCheckoutOpen, userId]);

  const handleSaveForLater = (item: any) => {
    if (item.product) {
      if (!isInWishlist(item.product.id)) {
        toggleWishlist(item.product);
      }
      removeItem(item.id);
    }
  };

  const handleCreateNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet || !newCity || !newRecipient || !newPhone) return;

    try {
      const created = await AddressService.createAddress(userId, {
        recipient_name: newRecipient,
        street_address: newStreet,
        city: newCity,
        country: 'Nigeria',
        phone: newPhone,
        postal_code: newPostalCode || '101233',
        is_default_shipping: addresses.length === 0,
        is_default_billing: addresses.length === 0,
      });

      if (created) {
        setAddresses((prev) => [created, ...prev]);
        setSelectedAddressId(created.id);
        setShowNewAddressForm(false);
        setNewStreet('');
      }
    } catch (err) {
      console.warn('Failed to add address in checkout:', err);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setOrderError('Please select or add a delivery address to proceed.');
      return;
    }

    const targetAddress = addresses.find((a) => a.id === selectedAddressId);
    if (!targetAddress) {
      setOrderError('Selected delivery destination is invalid.');
      return;
    }

    setIsPlacingOrder(true);
    setOrderError(null);

    try {
      const result = await OrderService.createOrder({
        userId,
        addressId: selectedAddressId,
        shippingAddress: targetAddress,
        items: cart.items,
        idempotencyKey,
        cartId: cart.id,
      });

      if (!result.success) {
        setOrderError(result.error || 'Failed to create order. Please review your cart.');
        return;
      }

      // Successful order creation: Clear the cart & show confirmation
      await clearCart();
      if (result.order) {
        setPlacedOrder(result.order);
      } else {
        setPlacedOrder({
          id: result.orderId || 'ord_success',
          order_number: result.orderNumber || 'ORD-NEW',
          user_id: userId,
          status: 'pending_payment',
          subtotal,
          shipping_fee: estimatedShipping,
          tax: estimatedTax,
          total: estimatedTotal,
          currency: cartCurrency,
          shipping_address: targetAddress,
          items: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setOrderError(err.message || 'An unexpected error occurred during order creation.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
    setPlacedOrder(null);
    setOrderError(null);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header & Breadcrumb */}
      <div>
        <Link
          to="/marketplace"
          id="btn-back-to-catalog"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#D4AF37] transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>

        <div className="border-b border-[#27272A] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Shopping Cart</h1>
              {isSyncing && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 animate-pulse">
                  Syncing...
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Review your selected garments, custom options, and order details.
            </p>
          </div>

          {cart.items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-zinc-500 hover:text-red-400 transition cursor-pointer self-start sm:self-auto"
            >
              Clear Cart
            </button>
          )}
        </div>
      </div>

      {/* 2. Empty State */}
      {cart.items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your Shopping Cart is Empty"
          description="You have not added any products to your cart yet. Explore our marketplace to discover tailored garments and luxury ready-to-wear."
          actionLabel="Start Shopping"
          onAction={() => navigate('/marketplace')}
        />
      ) : (
        /* 3. Real Commercial E-Commerce Grid (Cart Items + Order Summary) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Line Items (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Selected Garments ({cart.items.length})
            </div>

            {cart.items.map((item) => {
              const itemCurrency = item.product?.currency || cartCurrency;
              const itemLocale = itemCurrency === 'NGN' ? 'en-NG' : 'en-US';

              const formattedItemPrice = new Intl.NumberFormat(itemLocale, {
                style: 'currency',
                currency: itemCurrency,
                maximumFractionDigits: 0,
              }).format(item.unit_price);

              const formattedLineTotal = new Intl.NumberFormat(itemLocale, {
                style: 'currency',
                currency: itemCurrency,
                maximumFractionDigits: 0,
              }).format(item.unit_price * item.quantity);

              return (
                <div
                  key={item.id}
                  id={`cart-item-${item.id}`}
                  className="p-4 rounded-xl bg-[#121215] border border-[#27272A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Left: Image & Title */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                      {item.product?.hero_image ? (
                        <img
                          src={item.product.hero_image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="text-xs sm:text-sm font-semibold text-zinc-100 truncate">
                        <Link
                          to={`/product/${item.product?.slug}`}
                          className="hover:text-[#D4AF37] transition-colors"
                        >
                          {item.product?.name || 'Garment Item'}
                        </Link>
                      </h3>

                      {item.product?.seller && (
                        <p className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
                          <span>Sold by: {item.product.seller.business_name}</span>
                          {item.product.seller.verification_status === 'verified' && (
                            <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
                          )}
                        </p>
                      )}

                      {/* Variant Details */}
                      {item.variant && (
                        <div className="flex flex-wrap gap-2 text-[11px] text-zinc-400">
                          {item.variant.size && <span>Size: {item.variant.size}</span>}
                          {item.variant.color && <span>• Color: {item.variant.color}</span>}
                        </div>
                      )}

                      <div className="text-xs text-zinc-400 sm:hidden pt-1">
                        Price: <strong className="text-zinc-200">{formattedItemPrice}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity, Subtotal, Remove & Wishlist */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-800">
                    <div className="text-right hidden sm:block">
                      <span className="text-sm font-bold text-zinc-100 block">
                        {formattedLineTotal}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {formattedItemPrice} each
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-zinc-700 bg-zinc-900 rounded-lg overflow-hidden h-8">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-2.5 h-full hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-zinc-100">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 h-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Save for Later / Move to Wishlist */}
                      <button
                        onClick={() => handleSaveForLater(item)}
                        title="Move to Wishlist"
                        className="p-1.5 text-zinc-400 hover:text-[#D4AF37] transition-colors cursor-pointer"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            item.product && isInWishlist(item.product.id)
                              ? 'fill-[#D4AF37] text-[#D4AF37]'
                              : ''
                          }`}
                        />
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.id)}
                        title="Remove from Cart"
                        className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Order Summary (4 Cols) */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-[#121215] border border-[#27272A] space-y-4 sticky top-6">
            <h2 className="text-sm font-bold text-zinc-100 border-b border-[#27272A] pb-3">
              Order Summary
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-zinc-300">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-zinc-100">{formattedSubtotal}</span>
              </div>

              <div className="flex justify-between text-zinc-300">
                <span>Estimated Shipping:</span>
                <span className="text-emerald-400 font-medium">Complimentary</span>
              </div>

              <div className="flex justify-between text-zinc-300">
                <span>Estimated Taxes (7.5% VAT):</span>
                <span>{formattedTax}</span>
              </div>

              <div className="border-t border-[#27272A] pt-3 flex justify-between text-sm font-bold text-zinc-100">
                <span>Estimated Total:</span>
                <span className="text-base text-[#D4AF37]">{formattedTotal}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              id="btn-proceed-to-checkout"
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#c59b27] text-zinc-950 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer min-h-[44px]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Proceed to Checkout</span>
            </button>

            {/* Security Trust Badges */}
            <div className="pt-2 border-t border-[#27272A] space-y-2 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>Bank-grade encrypted checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>Buyer Protection & Escrow Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Checkout Dialog Flow */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#121215] border border-[#27272A] rounded-2xl p-6 space-y-5 my-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <div>
                <span className="text-[10px] font-serif uppercase tracking-widest text-[#D4AF37] font-semibold">
                  Checkout
                </span>
                <h3 className="text-base font-bold text-zinc-100">
                  {placedOrder ? 'Order Confirmation' : 'Delivery Address & Review'}
                </h3>
              </div>
              <button
                onClick={handleCloseCheckout}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Confirmation Screen */}
            {placedOrder ? (
              <div className="space-y-5 py-2 text-center">
                <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-zinc-100">Order Placed</h4>
                  <p className="text-xs text-zinc-400">
                    Your order number is{' '}
                    <span className="font-mono text-[#D4AF37] font-bold">
                      {placedOrder.order_number}
                    </span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-left space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Order Status:</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-medium uppercase">
                      Pending Payment
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Total:</span>
                    <span className="font-bold text-zinc-100">
                      {new Intl.NumberFormat(locale, {
                        style: 'currency',
                        currency: placedOrder.currency || 'NGN',
                        maximumFractionDigits: 0,
                      }).format(placedOrder.total)}
                    </span>
                  </div>
                  {placedOrder.shipping_address && (
                    <div className="border-t border-zinc-900 pt-2 text-zinc-400">
                      <span className="block text-[10px] uppercase font-semibold text-zinc-500">
                        Delivery Address:
                      </span>
                      <span className="text-zinc-300 font-medium">
                        {placedOrder.shipping_address.recipient_name}
                      </span>
                      <p className="text-[11px] text-zinc-500">
                        {placedOrder.shipping_address.street_address},{' '}
                        {placedOrder.shipping_address.city}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-left flex items-start gap-2.5 text-xs text-amber-300/90">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5 text-[#D4AF37]" />
                  <p className="text-[11px] leading-relaxed">
                    Order Registered: Payment gateways will be connected in the payment integration phase.
                    You can view this order in My Orders.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      handleCloseCheckout();
                      navigate('/account/orders');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c59b27] text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>View My Orders</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      handleCloseCheckout();
                      navigate('/marketplace');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs transition cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : (
              /* Step-by-Step Checkout Review Screen */
              <div className="space-y-5">
                {orderError && (
                  <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{orderError}</span>
                  </div>
                )}

                {/* 1. Destination Address Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-serif uppercase tracking-wider text-zinc-300 font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>1. Select Delivery Destination</span>
                    </label>
                    {!showNewAddressForm && (
                      <button
                        onClick={() => setShowNewAddressForm(true)}
                        className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add New Address
                      </button>
                    )}
                  </div>

                  {loadingAddresses ? (
                    <div className="p-4 text-center text-xs text-zinc-500">
                      Loading registered addresses...
                    </div>
                  ) : showNewAddressForm ? (
                    <form
                      onSubmit={handleCreateNewAddress}
                      className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3"
                    >
                      <h4 className="text-xs font-semibold text-zinc-200">New Fitting Destination</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Recipient Name"
                          value={newRecipient}
                          onChange={(e) => setNewRecipient(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="Phone (+234...)"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Street Address (e.g. 14 Alexander Ave, Ikoyi)"
                        value={newStreet}
                        onChange={(e) => setNewStreet(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="City"
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                        <input
                          type="text"
                          placeholder="Postal Code"
                          value={newPostalCode}
                          onChange={(e) => setNewPostalCode(e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-zinc-950 font-bold text-xs"
                        >
                          Use Address
                        </button>
                        {addresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowNewAddressForm(false)}
                            className="px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 text-xs"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  ) : addresses.length === 0 ? (
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                      <p className="text-xs text-zinc-400 mb-2">No saved address found.</p>
                      <button
                        onClick={() => setShowNewAddressForm(true)}
                        className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-zinc-950 text-xs font-semibold"
                      >
                        Add Address
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-start justify-between ${
                            selectedAddressId === addr.id
                              ? 'bg-[#D4AF37]/10 border-[#D4AF37]'
                              : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="font-semibold text-zinc-200 flex items-center gap-2">
                              <span>{addr.recipient_name}</span>
                              {addr.is_default_shipping && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-zinc-400 text-[11px]">
                              {addr.street_address}, {addr.city} ({addr.country})
                            </p>
                            <p className="text-zinc-500 text-[10px]">{addr.phone}</p>
                          </div>
                          <input
                            type="radio"
                            name="deliveryAddress"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 text-[#D4AF37] focus:ring-0"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Order Review & Financial Snapshot */}
                <div className="space-y-2 border-t border-[#27272A] pt-4">
                  <label className="text-xs font-serif uppercase tracking-wider text-zinc-300 font-semibold block">
                    2. Authoritative Order Breakdown
                  </label>

                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Garments ({cart.items.length} items):</span>
                      <span className="text-zinc-200">{formattedSubtotal}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Complimentary Luxury Shipping:</span>
                      <span className="text-emerald-400 font-medium">Free</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Value Added Tax (7.5% VAT):</span>
                      <span className="text-zinc-200">{formattedTax}</span>
                    </div>
                    <div className="border-t border-zinc-900 pt-2 flex justify-between font-bold text-zinc-100">
                      <span>Total Order Amount:</span>
                      <span className="text-sm text-[#D4AF37]">{formattedTotal}</span>
                    </div>
                  </div>
                </div>

                {/* Notice on pending payment phase */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>
                    The order will be created under <strong>Pending Payment</strong> status.
                    Authoritative totals and inventory reservation will be verified before order
                    creation. No payment card will be charged at this stage.
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex justify-end gap-3 border-t border-[#27272A]">
                  <button
                    type="button"
                    onClick={handleCloseCheckout}
                    disabled={isPlacingOrder}
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white text-xs font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-confirm-place-order"
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder || !selectedAddressId}
                    className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c59b27] text-zinc-950 font-bold text-xs transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 min-h-[40px]"
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying & Placing Order...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Confirm & Place Order</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

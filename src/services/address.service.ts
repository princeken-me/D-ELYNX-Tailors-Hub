import { getSupabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Address } from '../types/ecommerce';

export type CreateAddressInput = Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

const LOCAL_STORAGE_PREFIX = 'delynx_addresses_';

export class AddressService {
  /**
   * Fetch all registered addresses for the authenticated user
   */
  static async getUserAddresses(userId: string): Promise<Address[]> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', userId)
          .order('is_default_shipping', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('AddressService: Supabase query error:', error.message);
        } else if (data && data.length > 0) {
          return data as Address[];
        }
      } catch (err) {
        console.warn('AddressService: Unexpected error fetching addresses:', err);
      }
    }

    // Fallback: LocalStorage persistence for preview & offline development
    return this.getLocalAddresses(userId);
  }

  /**
   * Create a new address for the authenticated user
   */
  static async createAddress(userId: string, input: CreateAddressInput): Promise<Address | null> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        // If this address is set as default shipping, reset others
        if (input.is_default_shipping) {
          await supabase
            .from('addresses')
            .update({ is_default_shipping: false })
            .eq('user_id', userId);
        }

        const { data, error } = await supabase
          .from('addresses')
          .insert({
            user_id: userId,
            recipient_name: input.recipient_name,
            street_address: input.street_address,
            apartment_suite: input.apartment_suite || null,
            city: input.city,
            state_province: input.state_province || null,
            postal_code: input.postal_code,
            country: input.country || 'Nigeria',
            phone: input.phone,
            is_default_shipping: input.is_default_shipping ?? false,
            is_default_billing: input.is_default_billing ?? false,
          })
          .select()
          .single();

        if (error) {
          console.warn('AddressService: Error creating address:', error.message);
        } else if (data) {
          return data as Address;
        }
      } catch (err) {
        console.warn('AddressService: Unexpected error creating address:', err);
      }
    }

    // Fallback: LocalStorage creation
    const newAddr: Address = {
      id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      recipient_name: input.recipient_name,
      street_address: input.street_address,
      apartment_suite: input.apartment_suite || null,
      city: input.city,
      state_province: input.state_province || null,
      postal_code: input.postal_code,
      country: input.country || 'Nigeria',
      phone: input.phone,
      is_default_shipping: input.is_default_shipping ?? false,
      is_default_billing: input.is_default_billing ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const existing = this.getLocalAddresses(userId);
    if (newAddr.is_default_shipping) {
      existing.forEach((a) => (a.is_default_shipping = false));
    }
    const updated = [newAddr, ...existing];
    this.saveLocalAddresses(userId, updated);
    return newAddr;
  }

  /**
   * Set default shipping destination
   */
  static async setDefaultShipping(userId: string, addressId: string): Promise<boolean> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        await supabase
          .from('addresses')
          .update({ is_default_shipping: false })
          .eq('user_id', userId);

        const { error } = await supabase
          .from('addresses')
          .update({ is_default_shipping: true })
          .eq('id', addressId)
          .eq('user_id', userId);

        if (!error) return true;
      } catch (err) {
        console.warn('AddressService: Error updating default address:', err);
      }
    }

    const list = this.getLocalAddresses(userId);
    list.forEach((a) => {
      a.is_default_shipping = a.id === addressId;
    });
    this.saveLocalAddresses(userId, list);
    return true;
  }

  /**
   * Update an existing address (strictly verified against userId ownership)
   */
  static async updateAddress(
    userId: string,
    addressId: string,
    input: Partial<CreateAddressInput>
  ): Promise<Address | null> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        if (input.is_default_shipping) {
          await supabase
            .from('addresses')
            .update({ is_default_shipping: false })
            .eq('user_id', userId);
        }

        const cleanUpdates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (input.recipient_name !== undefined) cleanUpdates.recipient_name = input.recipient_name;
        if (input.street_address !== undefined) cleanUpdates.street_address = input.street_address;
        if (input.apartment_suite !== undefined) cleanUpdates.apartment_suite = input.apartment_suite;
        if (input.city !== undefined) cleanUpdates.city = input.city;
        if (input.state_province !== undefined) cleanUpdates.state_province = input.state_province;
        if (input.postal_code !== undefined) cleanUpdates.postal_code = input.postal_code;
        if (input.country !== undefined) cleanUpdates.country = input.country;
        if (input.phone !== undefined) cleanUpdates.phone = input.phone;
        if (input.is_default_shipping !== undefined) cleanUpdates.is_default_shipping = input.is_default_shipping;
        if (input.is_default_billing !== undefined) cleanUpdates.is_default_billing = input.is_default_billing;

        const { data, error } = await supabase
          .from('addresses')
          .update(cleanUpdates)
          .eq('id', addressId)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          return data as Address;
        }
      } catch (err) {
        console.warn('AddressService: Error updating address:', err);
      }
    }

    // Local fallback
    const list = this.getLocalAddresses(userId);
    const index = list.findIndex((a) => a.id === addressId && a.user_id === userId);
    if (index === -1) return null;

    if (input.is_default_shipping) {
      list.forEach((a) => (a.is_default_shipping = false));
    }

    list[index] = {
      ...list[index],
      ...input,
      updated_at: new Date().toISOString(),
    };
    this.saveLocalAddresses(userId, list);
    return list[index];
  }

  /**
   * Delete an address (verifying user ownership)
   */
  static async deleteAddress(userId: string, addressId: string): Promise<boolean> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('addresses')
          .delete()
          .eq('id', addressId)
          .eq('user_id', userId);

        if (!error) return true;
      } catch (err) {
        console.warn('AddressService: Error deleting address:', err);
      }
    }

    const list = this.getLocalAddresses(userId).filter((a) => a.id !== addressId);
    this.saveLocalAddresses(userId, list);
    return true;
  }

  // Local storage helpers
  private static getLocalAddresses(userId: string): Address[] {
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${userId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }

    // Default starter address for luxury Nigerian tailoring
    const defaultAddresses: Address[] = [
      {
        id: 'addr_default_lagos',
        user_id: userId,
        recipient_name: 'Adewale Adeleke',
        street_address: '14 Alexander Avenue, Ikoyi',
        apartment_suite: 'Penthouse B',
        city: 'Lagos',
        state_province: 'Lagos State',
        postal_code: '101233',
        country: 'Nigeria',
        phone: '+234 803 123 4567',
        is_default_shipping: true,
        is_default_billing: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    this.saveLocalAddresses(userId, defaultAddresses);
    return defaultAddresses;
  }

  private static saveLocalAddresses(userId: string, addresses: Address[]): void {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${userId}`, JSON.stringify(addresses));
    } catch {
      // ignore
    }
  }
}

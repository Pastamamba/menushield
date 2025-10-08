import { useState, useEffect } from 'react';
import { useRestaurant, useUpdateRestaurant } from '../utils/restaurantApi';

export default function RestaurantSettings() {
  const { data: restaurant, isLoading } = useRestaurant();
  const updateRestaurantMutation = useUpdateRestaurant();
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    contact: '',
    showPrices: true,
  });

  // Update form when restaurant data loads
  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name || '',
        description: restaurant.description || '',
        contact: restaurant.contact || '',
        showPrices: restaurant.showPrices !== undefined ? restaurant.showPrices : true,
      });
    }
  }, [restaurant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateRestaurantMutation.mutateAsync(form);
      alert('Restaurant settings updated successfully!');
    } catch (error) {
      console.error('Error updating restaurant:', error);
      alert('Failed to update restaurant settings. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Restaurant Settings</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Restaurant Settings</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
          Settings will apply to your public menu
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🏪</span>
            Basic Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="Your Restaurant Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Brief description of your restaurant"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Information
              </label>
              <input
                type="text"
                name="contact"
                value={form.contact}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="Phone number, email, or address"
              />
            </div>
          </div>
        </div>

        {/* Menu Display Settings */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">💰</span>
            Menu Display Settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  name="showPrices"
                  checked={form.showPrices}
                  onChange={handleChange}
                  className="w-5 h-5 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Show Prices to Guests
                </label>
                <p className="text-sm text-gray-600">
                  When enabled, dish prices will be visible to guests on the public menu. 
                  Disable this if you prefer to discuss pricing in person or have a market-price menu.
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-full text-white font-medium ${
                    form.showPrices ? 'bg-green-500' : 'bg-gray-400'
                  }`}>
                    {form.showPrices ? 'Prices Visible' : 'Prices Hidden'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateRestaurantMutation.isPending}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {updateRestaurantMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <span>💾</span>
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
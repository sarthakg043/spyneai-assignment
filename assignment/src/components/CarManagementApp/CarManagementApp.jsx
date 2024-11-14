import React, { useState, useEffect } from 'react';
import { useAuth } from '../Auth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogOut, Search, Plus, Edit, Trash2, Loader2 } from 'lucide-react';

// API service functions
const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

const api = {
  // Generic fetch function with auth
  fetchWithAuth: async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Something went wrong');
    }
    
    return response.json();
  },

  // Cars API endpoints
  cars: {
    list: (search = '') => {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      return api.fetchWithAuth(`/cars${query}`);
    },

    create: async (formData) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cars`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create car');
      }
      return response.json();
    },

    get: (id) => api.fetchWithAuth(`/cars/${id}`),

    update: async (id, formData) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cars/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update car');
      }
      return response.json();
    },

    delete: (id) => api.fetchWithAuth(`/cars/${id}`, { method: 'DELETE' }),
  },
};

const CarManagementApp = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch cars when search query changes
  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.cars.list(searchQuery);
        setCars(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchCars, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleCreateCar = async (formData) => {
    setLoading(true);
    setError('');
    try {
      const newCar = await api.cars.create(formData);
      setCars(prevCars => [newCar, ...prevCars]);
      setCurrentView('list');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCar = async (id, formData) => {
    setLoading(true);
    setError('');
    try {
      const updatedCar = await api.cars.update(id, formData);
      setCars(prevCars => 
        prevCars.map(car => car._id === id ? updatedCar : car)
      );
      setCurrentView('list');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCar = async (id) => {
    if (!window.confirm('Are you sure you want to delete this car?')) return;
    
    setLoading(true);
    setError('');
    try {
      await api.cars.delete(id);
      setCars(prevCars => prevCars.filter(car => car._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <nav className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Car Management</h1>
          <p className="text-sm text-gray-600">Welcome, {user.email}</p>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={() => {
              setSelectedCar(null);
              setCurrentView('create');
            }}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> Add New Car
          </Button>
          <Button 
            variant="outline" 
            onClick={logout}
            className="flex items-center gap-2"
          >
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </nav>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {currentView === 'list' && (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search cars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((car) => (
                <CarCard 
                  key={car._id} 
                  car={car}
                  onEdit={() => {
                    setSelectedCar(car);
                    setCurrentView('edit');
                  }}
                  onDelete={() => handleDeleteCar(car._id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {(currentView === 'create' || currentView === 'edit') && (
        <CarForm 
          car={selectedCar}
          onSubmit={async (formData) => {
            if (selectedCar) {
              await handleUpdateCar(selectedCar._id, formData);
            } else {
              await handleCreateCar(formData);
            }
          }}
          onCancel={() => {
            setSelectedCar(null);
            setCurrentView('list');
          }}
        />
      )}
    </div>
  );
};

const CarCard = ({ car, onEdit, onDelete }) => (
  <Card>
    {car.images?.[0] && (
      <img
        src={`${car.images[0]}`}
        alt={car.title}
        className="w-full h-48 object-cover rounded-t-lg"
      />
    )}
    <CardHeader>
      <CardTitle>{car.title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-gray-600 mb-4">{car.description}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {car.tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit size={16} className="mr-2" /> Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 size={16} className="mr-2" /> Delete
        </Button>
      </div>
    </CardContent>
  </Card>
);

const CarForm = ({ car, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.target);
    const images = formData.getAll("images");

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const invalidFiles = images.filter(file => !allowedTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setError('Only .jpeg, .jpg, and .png files are allowed.');
      setLoading(false);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError('Form submission error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{car ? 'Edit Car' : 'Add New Car'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={car?.title}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={car?.description}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              name="tags"
              defaultValue={car?.tags?.join(', ')}
              placeholder="electric, sedan, Tesla"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="images">Images (up to 10)</Label>
            <Input
              id="images"
              name="images"
              type="file"
              multiple
              accept=".jpeg,.jpg,.png"
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {car ? 'Update Car' : 'Create Car'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CarManagementApp;
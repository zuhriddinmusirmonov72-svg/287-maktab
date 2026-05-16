import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useContext(AppContext);
  const [name, setName] = useState(user.name);
  const [photoInput, setPhotoInput] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    updateUser({ name, photo: photoInput || user.photo });
    toast.success("Profil muvaffaqiyatli saqlandi!");
  };

  return (
    <div className="page-container" style={{ maxWidth: '600px' }}>
      <h1 className="page-title" style={{ marginBottom: '24px' }}>Profil sozlamalari</h1>
      
      <div className="content-card" style={{ padding: '32px' }}>
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
            <div className="profile-img-lg">
              {photoInput || user.photo ? (
                <img src={photoInput || user.photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Profil rasmini o'zgartirish (URL kiriting)</p>
              <input
                type="text"
                placeholder="Rasm manzili (URL)"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">To'liq ism</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
            <button type="submit" className="btn-primary">
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;

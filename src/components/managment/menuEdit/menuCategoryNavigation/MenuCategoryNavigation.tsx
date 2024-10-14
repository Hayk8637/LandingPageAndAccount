import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import styles from './style.module.css';
import { db } from '../../../../firebaseConfig';
import { useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

interface Category {
  id: string; // category ID
  name: string; // category name
}

interface MenuCategoryItem {
  id: string;
  name: string;
  imgUrl: string | null;
  isVisible: boolean;
  order: number;
}
interface EstablishmentStyles {
  color1: string;
  color2: string;
  color3: string;
  color4: string;
  color5: string;
}

const MenuCategoryNavigation: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [, setError] = useState<string | null>(null);
  const [establishmentStyles, setEstablishmentStyles] = useState<EstablishmentStyles>();
  const pathname = useLocation().pathname || '';
  const currentCategoryName = pathname.split('/').filter(Boolean).pop() || '';
  const establishmentId = pathname.split('/')[pathname.split('/').length - 2] || '';
  const [userId, setUserId] = useState<string | null>(null);  

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribeAuth = onAuthStateChanged(auth, (user:any) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null); 
      }
    });

    return () => unsubscribeAuth();
  }, []);
  useEffect(() => {
    const fetchCategories = async () => {
        if (userId && establishmentId) {
          try {
            const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
            const docSnap = await getDoc(docRef);
  
            if (docSnap.exists()) {
              const data = docSnap.data();
              const categories = data.menu?.categories || {};
  
              const items: MenuCategoryItem[] = Object.entries(categories).map(([id, category]: any) => ({
                id,
                name: category.name,
                order: category.order,
                imgUrl: category.imgUrl,
                isVisible: category.isVisible ?? true,
              }));
                items.sort((a, b) => a.order - b.order);
              setEstablishmentStyles(data.styles)
              setCategories(items);
            } else {
              setError('No categories found');
            }
          } catch (error) {
            setError('Error fetching menu items');
          } finally {
          }
        }
      };

    fetchCategories();
  }, [userId, establishmentId]);


  return (
    <div className={styles.menuCategoryNavigation} style={{backgroundColor: `#${establishmentStyles?.color1}`}}>
      {categories.map((category) => ( 
        <a
          key={category.id}
          href={`/profile/establishments/${establishmentId}/${category.id}`} 
          className={currentCategoryName === category.id ? styles.activeTab : styles.a} 
          style={{ color: currentCategoryName === category.id ? `#${establishmentStyles?.color2}` : `#${establishmentStyles?.color3}`,
                   backgroundColor: currentCategoryName === category.id ? `#${establishmentStyles?.color5}` : ``,
                   borderColor: currentCategoryName === category.id ? `` : `#${establishmentStyles?.color2}`,
                }}>
          {category.name}
        </a>
      ))}
    </div>
  );
};

export default MenuCategoryNavigation;

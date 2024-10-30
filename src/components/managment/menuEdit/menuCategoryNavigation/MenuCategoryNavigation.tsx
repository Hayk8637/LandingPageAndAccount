import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { doc, getDoc } from 'firebase/firestore';
import styles from './style.module.css';
import { db } from '../../../../firebaseConfig';
import { useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { ICategory, IEstablishmentStyles, ILanguage, IMenuCategoryItem } from '../../../../interfaces/interfaces';
import i18n from '../../../../translations/i18n';

const MenuCategoryNavigation: React.FC = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [, setError] = useState<string | null>(null);
  const [establishmentStyles, setEstablishmentStyles] = useState<IEstablishmentStyles>();
  const pathname = useLocation().pathname || '';
  const currentCategoryName = pathname.split('/').filter(Boolean).pop() || '';
  const establishmentId = pathname.split('/')[pathname.split('/').length - 2] || '';
  const [userId, setUserId] = useState<string | null>(null);  
  const [currentLanguage, setCurrentLanguage] = useState<ILanguage>('en'); 
  useEffect(() => {
    const savedLanguage = localStorage.getItem('menuLanguage');
    if (savedLanguage === 'en' || savedLanguage === 'am' || savedLanguage === 'ru') {
      setCurrentLanguage(savedLanguage);
    } else {
      localStorage.setItem('menuLanguage', 'en');
    }
  }, [currentLanguage]);
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
    const savedLanguage = localStorage.getItem('language'); 
    if (savedLanguage && i18n?.changeLanguage) {
      i18n.changeLanguage(savedLanguage); 
    }
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
  
              const items: IMenuCategoryItem[] = Object.entries(categories).map(([id, category]: any) => ({
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
              setError('');
            }
          } catch (error) {
            setError('');
          } finally {
          }
        }
      };
    fetchCategories();
  }, [userId, establishmentId]);

  return (
    <div className={styles.menuCategoryNavigation} style={{backgroundColor: `#${establishmentStyles?.color1}`}}>
      {categories.map((category) => ( 
         <Button
            key={category.id}
            href={`/profile/establishments/${establishmentId}/${category.id}`}
            className={currentCategoryName === category.id ? styles.activeTab : styles.a}
            style={{
              color: currentCategoryName === category.id
                ? `#${establishmentStyles?.color1}`
                : `#${establishmentStyles?.color2}`,
              backgroundColor: currentCategoryName === category.id
                ? `#${establishmentStyles?.color2}`
                : `#${establishmentStyles?.color1}`,
              borderColor: currentCategoryName === category.id
                ? `#${establishmentStyles?.color1}`
                : `#${establishmentStyles?.color2}`,
            }}>
            {category.name[currentLanguage]}
       </Button>
      ))}
    </div>
  );
};

export default MenuCategoryNavigation;

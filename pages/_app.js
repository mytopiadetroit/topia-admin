import "@/styles/globals.css";
import { useEffect, useState, createContext, useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import Loader from "@/components/loader";
import { setGlobalRouter, setGlobalToast } from '../service/service.js';

// Create contexts
export const userContext = createContext();
export const cartContext = createContext();
export const favoriteProductContext = createContext();

// User context
const UserContext = createContext();

// Custom hook to use the user context
export const useUser = () => {
  return useContext(UserContext);
};



export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [user, setUser] = useState({});
  const [open, setOpen] = useState(false);
  const [cartData, setCartData] = useState([]);
  const [Favorite, setFavorite] = useState([]);
  
  useEffect(() => {
    setOpen(open);
  }, [open]);

  useEffect(() => {
    // Set global router for auth redirects
    setGlobalRouter(router);
    
    // Set global toast function
    setGlobalToast((t) => {
      if (t.type === "success") {
        toast.success(t.message);
      } else if (t.type === "error") {
        toast.error(t.message);
      } else {
        toast(t.message);
      }
    });
    
    if (router.route === "/") {
      router.replace("/");
    }
    getUserDetail();
  }, [router]);

  const getUserDetail = () => {
    const user = localStorage.getItem("userDetail");
    if (user) {
      setUser(JSON.parse(user));
    }

    let cart = localStorage.getItem("addCartDetail");
    if (cart) {
      setCartData(JSON.parse(cart));
    }
    const favorites = localStorage.getItem("favoriteProducts");
    if (favorites) {
      setFavorite(JSON.parse(favorites));
    }
  };

  return (
    <>
      <ToastContainer />
      <UserContext.Provider value={{
        user: user,
        isLoggedIn: !!user,
        loading: false,
        login: (userData, token) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
            localStorage.setItem('userDetail', JSON.stringify(userData));
            setUser(userData);
            return true;
          }
          return false;
        },
        logout: () => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('userDetail');
            setUser({});
            router.push('/');
            return true;
          }
          return false;
        },
        updateUser: (newUserData) => {
          const updatedUser = { ...user, ...newUserData };
          if (typeof window !== 'undefined') {
            localStorage.setItem('userDetail', JSON.stringify(updatedUser));
          }
          setUser(updatedUser);
          return true;
        }
      }}>
        <userContext.Provider value={[user, setUser]}>
          <cartContext.Provider value={[cartData, setCartData]}>
            <favoriteProductContext.Provider value={[Favorite, setFavorite]}>
              <Layout loader={setOpen} toaster={(t) => {
                if (t.type === "success") {
                  toast.success(t.message);
                } else if (t.type === "error") {
                  toast.error(t.message);
                } else {
                  toast(t.message);
                }
              }}>
                {open && <Loader open={open} />}
                <Component {...pageProps} loader={setOpen} user={user} />
              </Layout>
            </favoriteProductContext.Provider>
          </cartContext.Provider>
        </userContext.Provider>
      </UserContext.Provider>
    </>
  );
}

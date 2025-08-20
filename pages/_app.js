import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/router";
import Loader from "@/components/loader";
import { setGlobalToast, setGlobalRouter } from "@/service/service";


export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [user, setUser] = useState({});
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    getUserDetail();
    // Hook global helpers for service-layer toasts/router redirects
    setGlobalToast(toast);
    setGlobalRouter(router);
    const dismissToasts = () => toast.dismiss();
    router.events.on('routeChangeStart', dismissToasts);
    const authHandler = () => toast.dismiss();
    document.addEventListener('auth-state-changed', authHandler);
    return () => {
      router.events.off('routeChangeStart', dismissToasts);
      document.removeEventListener('auth-state-changed', authHandler);
    };
  }, []);

  const getUserDetail = () => {
    const user = localStorage.getItem("userDetail");
    if (user) {
      setUser(JSON.parse(user));
    }
  };

  return (
    <>
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        limit={5}
        enableMultiContainer={false}
        closeButton={true}
        theme="light"
      />
      {open && <Loader open={open} />}
      <Component {...pageProps} loader={setOpen} user={user} />
    </>
  );
}

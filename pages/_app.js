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
  }, []);

  const getUserDetail = () => {
    const user = localStorage.getItem("userDetail");
    if (user) {
      setUser(JSON.parse(user));
    }
  };

  return (
    <>
      <ToastContainer />
      {open && <Loader open={open} />}
      <Component {...pageProps} loader={setOpen} user={user} />
    </>
  );
}

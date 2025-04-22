import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { Navbar, Footer } from "../Components";
import { CrowdFundProvider } from "../Context/CrowdFund";

export default function App({ Component, pageProps }) {
  return (
    <CrowdFundProvider>
      <div className='bg-gray-900 min-h-screen'>
        <Navbar />
        <Toaster position="top-center" />
        <Component {...pageProps} />
        <Footer />
      </div>
    </CrowdFundProvider>
  );
}

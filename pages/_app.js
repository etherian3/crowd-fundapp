import '../styles/globals.css';

// INTERNAL IMPORTS
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import { CrowdFundProvider } from '../Context/CrowdFund';

export default function App({ Component, pageProps }) {
  return (
    <CrowdFundProvider>
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </CrowdFundProvider>
  );
}

import "@/styles/globals.css";

// INTERNAL IMPORTS
import { Navbar, Footer } from "@/Components";
import { CrowdFundProvider } from "@/Context/CrowdFund";

export default function App({ Component, pageProps }) {
  return (
    <div>
      <CrowdFundProvider>
        <Navbar />
        <Component {...pageProps} />
        <Footer />
      </CrowdFundProvider>
    </div>
  );
}

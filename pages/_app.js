import "@/styles/globals.css";

// INTERNAL IMPORTS
import { Navbar, Footer } from "@/Components";

export default function App({ Component, pageProps }) {
  return (
    <div>
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </div>
  );
}

import React from "react";

function Footer() {
  const productList = ["Market", "ERC20 Token", "Donation"];
  const contactList = ["support@cryptoking.com", "info@example", "Contact us"];
  const usefullLink = ["Home", "About us", "Company Bio"];

  return (
    <footer className="footer-wrapper border-t-4 border-purple-600  bg-gray-950">
      <div className="px-4 pt-16 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8">
        <div className="grid gap-10 row-gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <a href="/" className="inline-flex items-center">
              <span className="text-xl font-bold tracking-wide text-white uppercase">
                Crypto King
              </span>
            </a>
            <div className="mt-6 lg:max-w-sm">
              <p className="text-sm text-gray-300">
                Platform crowdfunding terdesentralisasi menggunakan blockchain
                untuk transparansi dan keamanan yang lebih baik.
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-base font-bold tracking-wide text-white">
              Produk
            </p>
            {productList.map((el, i) => (
              <div key={i + 1}>
                <a
                  href="/"
                  className="text-gray-300 transition-colors duration-300 hover:text-purple-400"
                >
                  {el}
                </a>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-base font-bold tracking-wide text-white">
              Kontak
            </p>
            {contactList.map((el, i) => (
              <div key={i + 1}>
                <a
                  href="/"
                  className="text-gray-300 transition-colors duration-300 hover:text-purple-400"
                >
                  {el}
                </a>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between pt-5 pb-10 border-t border-gray-700 sm:flex-row">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Crypto King. Hak cipta dilindungi.
          </p>
          <div className="flex items-center mt-4 space-x-4 sm:mt-0">
            {usefullLink.map((el, i) => (
              <a
                key={i + 1}
                href="/"
                className="text-gray-400 transition-colors duration-300 hover:text-purple-400"
              >
                {el}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

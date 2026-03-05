import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-xl mb-3">
              <span className="text-2xl">👟</span>
              <span>Bamie <span style={{ color: '#e45826' }}>Kiddies</span></span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Premium footwear for every little step. Quality shoes crafted for comfort and style.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Shop</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/shop',                      label: 'All Products' },
                { href: '/shop?category=sneakers',     label: 'Sneakers' },
                { href: '/shop?category=sandals',      label: 'Sandals' },
                { href: '/shop?category=school shoes', label: 'School Shoes' },
                { href: '/shop?category=boots',        label: 'Boots' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>support@bamiekiddies.com</li>
              <li>+234 000 000 0000</li>
              <li className="text-gray-500 text-xs pt-2">Mon – Sat, 9am – 6pm WAT</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Bamie Kiddies. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

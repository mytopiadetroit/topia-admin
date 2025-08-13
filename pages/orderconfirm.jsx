import { Check, ChevronLeft } from 'lucide-react';

export default function OrderConfirm() {
  // Order data
  const orderData = {
    orderId: "123456789",
    orderDate: "01 July, 2025",
    items: [
      {
        id: 1,
        name: "Lion's Mane Capsules",
        quantity: 1,
        price: 50,
        image: "/images/img3.png"
      },
      {
        id: 2,
        name: "Mush Love Chocolate",
        quantity: 1,
        price: 20,
        image: "/images/img3.png"
      }
    ],
    contact: {
      phone: "+1 (444)-555-22",
      email: "example@email.com"
    }
  };

  // Calculate totals
  const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = 5;
  const grandTotal = subtotal + tax;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Top Confirmation Section */}
        <div className="text-center mb-12">
          {/* Green Checkmark Circle */}
          <div className="w-44 h-44  rounded-full border-4  shadow-lg mx-auto mb-6 flex items-center justify-center">
            <img src="/images/check.png" alt="abc" />
          </div>
          
          {/* Heading */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cart Submitted</h1>
          
          {/* Sub-text */}
          <p className="text-lg text-gray-700">Thank you for your order!</p>
        </div>
  <div className="flex justify-end mt-4 mb-8">
  <button onClick={() => window.location.href = '/menu'} className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors">
    <ChevronLeft className="w-4 h-4" />
    <span>Back to Menu</span>
  </button>
</div>

        {/* Order Details Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header - Dark Blue/Gray Bar */}
          <div className="bg-[#536690] text-white px-6 py-4 flex justify-between items-center">
            <span className="font-medium">Order ID: {orderData.orderId}</span>
            <span className="font-medium">Order Date: {orderData.orderDate}</span>
          </div>

          {/* Body - White Background */}
          <div className="p-10 rounded-xl">
            {/* Product Listings */}
            <div className="space-y-4 mb-8">
              {orderData.items.map((item, index) => (
                <div key={item.id}>
                  <div className="flex items-center gap-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">$ {item.price}</span>
                    </div>
                  </div>
                  
                  {/* Divider after each item */}
                  <div className="border-t border-gray-200 mt-4"></div>
                </div>
              ))}
            </div>

            {/* Bottom Section */}
            <div className="flex justify-between items-start">
              {/* Contact Information - Bottom Left */}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">Need Help ?</h3>
                <p className="text-sm text-gray-600 mb-1">{orderData.contact.phone}</p>
                <p className="text-sm text-gray-600">{orderData.contact.email}</p>
              </div>

              {/* Bill Summary - Bottom Right */}
              <div className="flex-1 text-right">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">${subtotal}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">${tax}</span>
                  </div>
                  
                  {/* Divider */}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">Grand Total:</span>
                      <span className="text-xl font-bold text-gray-900">${grandTotal}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

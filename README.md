# 🍳 RestoKitchen - Next-Gen Restaurant POS

RestoKitchen is a premium, high-performance Point of Sale (POS) and Kitchen Display System (KDS) designed for modern culinary environments. It combines real-time data synchronization with AI-powered insights to streamline the journey from table-side ordering to kitchen preparation and final billing.

## ✨ Key Features

### 🏢 Order Desk (Front-of-House)
- **Visual Table Management:** Real-time status indicators (Available, Occupied, Ready for Bill).
- **Dynamic Menu Grid:** Category-based filtering (Starters, Main, Drinks, Desserts) with instant search.
- **Smart Cart System:** Seamlessly add or adjust items with automatic subtotal and tax calculation.
- **Order Updates:** Add items to existing table sessions without creating duplicate orders.

### 👨‍🍳 Kitchen Display System (KDS)
- **Live Order Stream:** Cards organized by order time with visual progress bars.
- **Progress Tracking:** Three-stage workflow (Ordered → Preparing → Finished) with intuitive status buttons.
- **Integrated Menu Manager:** Admin-level control to add, edit, or remove food items directly from the kitchen interface.


### 🧾 Billing & Finance
- **Automated Invoicing:** Generates print-ready receipts with accurate tax (GST) breakdowns.
- **Payment Success UX:** Immersive full-screen celebration animation upon successful payment collection.
- **Table Recycling:** Automatically clears and resets table status to 'Available' once the transaction is finalized.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript
- **Styling:** Tailwind CSS 
- **Backend/Database:** Firebase Firestore 
- **Authentication:** Firebase Anonymous Auth

## 📁 Project Structure

```text
├── App.tsx            
├── index.tsx          
├── types.ts           
├── constants.tsx       
├── components/
│   └── UI.tsx          
└── metadata.json       
```

RestoKitchen represents a seamless fusion of speed, intelligence, and thoughtful design, redefining how modern restaurants operate. By connecting front-of-house, kitchen, and billing into a single real-time ecosystem, it eliminates friction and enhances efficiency at every step. With AI-powered assistance, a robust tech stack, and a user-first philosophy, RestoKitchen isn’t just a POS—it’s a smarter, faster, and more delightful way to run hospitality for the future.

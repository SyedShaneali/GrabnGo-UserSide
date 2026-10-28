import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./screens/auth/Login";
import { ThemeProvider } from "./context/ThemeContext";
import { PresenceProvider } from "./context/PresenceContext";
import { NotificationCountProvider } from "./context/NotificationCountContext"; // ⭐ added
import { useFcmListener } from "./hooks/useFcmListener"; // ⭐ added
import UserLayout from "./screens/user/UserLayout";
import Home from "./screens/user/Home";
import OrderDetailsScreen from "./screens/order/OrderDetailsScreen";
import OrderDetails from "./screens/order/OrderDetails";
import Offers from "./screens/offers/Offers";
import OfferDetails from "./screens/offers/OfferDetails";
import TravelDetails from "./screens/travels/TravelDetails";
import CreateOrder from "./screens/order/CreateOrder";
import MyOrders from "./screens/order/MyOrders";
import TrackOrder from "./screens/order/TrackOrder";
import MyTravels from "./screens/travels/MyTravels";
import CreateTravel from "./screens/travels/CreateTravel";
import ChatScreen from "./screens/chat/ChatScreen";
import ChatsListScreen from "./screens/chat/ChatLIstScreen";
import Register from "./screens/auth/Register";
import VerifyOtp from "./screens/auth/VerifyOtp";
import Notifications from "./screens/user/Notifications";
import EditOrder from "./screens/order/EditOrder";

// ⭐ Only mounts once the user is inside the layout (i.e. after login), so it
// never runs on the Login page with no token yet. It remounts on every login /
// account switch, which is what re-registers the FCM token for the active user.
function FcmListenerMount() {
  useFcmListener();
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <NotificationCountProvider>
        <PresenceProvider>
          <BrowserRouter>
            <Toaster position="top-center" gutter={10} containerStyle={{ top: 20 }} />
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route
                element={
                  <>
                    <FcmListenerMount />
                    <UserLayout />
                  </>
                }
              >
                <Route path="/home" element={<Home />} />
                <Route path="/order-details/:id" element={<OrderDetails />} />
                <Route path="/orders/:orderId" element={<OrderDetailsScreen />} />
                <Route path="/offers" element={<Offers />} />
                <Route path="/offers/:id" element={<OfferDetails />} />
                <Route path="/travels/:travelId" element={<TravelDetails />} />
                <Route path="/create-order" element={<CreateOrder />} />
                <Route path="/orders/:id/track" element={<TrackOrder />} />
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/my-travels" element={<MyTravels />} />
                <Route path="/create-travel" element={<CreateTravel />} />
                <Route path="/chat/:id" element={<ChatScreen />} />
                <Route path="/chat" element={<ChatsListScreen />} />
                <Route path="/notifications" element={<div className="p-6"><Notifications/></div>} />
                <Route path="/orders/:orderId/edit" element={<EditOrder />} />

                <Route path="/profile" element={<div className="p-6">Profile</div>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PresenceProvider>
      </NotificationCountProvider>
    </ThemeProvider>
  );
}

export default App;
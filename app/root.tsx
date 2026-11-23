import { Provider } from "react-redux";
import store from "./store/store";
import SingleModelWorkflow from "./components/SingleModelWorkflow";
import NotificationsContainer from "./components/Layout/Notifications/NotificationsContainer";
import "./tailwind.css";

export default function App() {
  return (
    <Provider store={store}>
      <main className="p-6 md:p-8" id="main-content"><SingleModelWorkflow /></main>
      <NotificationsContainer />
    </Provider>
  );
}

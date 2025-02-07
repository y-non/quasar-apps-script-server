import { useAuthenticationStore } from "src/stores/AuthenticationStore";
import { supabase } from "./superbase";
import { useAdminStore } from "src/stores/AdminStore";
import { dateUtil } from "./dateUtil";

const subscribeToTableUserSessions = async () => {
  try {
    const storeAuthentication = useAuthenticationStore();
    const subscription = supabase
      .channel("public:user_sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_sessions",
        },
        async (payload) => {
          if (payload) {
            await storeAuthentication.validateSession();
          }
        }
      )
      .subscribe();

    return subscription;
  } catch (err) {
    console.error("Error subscribing to changes: ", err);
  }
};

const subscribeToTableOrders = async () => {
  try {
    const storeAdmin = useAdminStore();

    const subscription = supabase
      .channel("public:orders")
      .on(
        "postgres_changes",
        {
          event: "*", // You can change this to "INSERT", "UPDATE", "DELETE" if needed
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          if (payload) {
            console.log("Received change:", payload);

            let fullOrder = {};

            // Handle different event types
            switch (payload.eventType) {
              case "INSERT":
                // Fetch the full order data with the user details
                fullOrder = await storeAdmin.fetchOrderWithUser(payload.new.id);

                if (fullOrder) {
                  const formattedTime = dateUtil.formatDate(
                    fullOrder.created_at
                  );

                  fullOrder.datum = formattedTime;

                  storeAdmin.listOrder.unshift(fullOrder); // Add to list (newest first)
                }
                // storeAdmin.listOrder.unshift(payload.new);
                break;
              case "UPDATE":
                storeAdmin.listOrder = storeAdmin.listOrder.map((order) =>
                  order.id === payload.new.id ? payload.new : order
                );
                break;
              case "DELETE":
                storeAdmin.listOrder = storeAdmin.listOrder.filter(
                  (order) => order.id !== payload.old.id
                );
                break;
              default:
                console.warn("Unknown event type:", payload.eventType);
            }
          }
        }
      )
      .subscribe();

    return subscription;
  } catch (err) {
    console.error("Error subscribing to changes: ", err);
  }
};

// Unsubscribe when component unmounts
const unsubscribeFromOrders = async (subscription) => {
  if (subscription) {
    await supabase.removeChannel(subscription);
    console.log("Unsubscribed from orders.");
  }
};

export const subscribeUtil = {
  subscribeToTableUserSessions,
  subscribeToTableOrders,
};

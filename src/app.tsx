import FocusScreen from "./screens/focus-screen"
import StoreProvider from "./store/store-provider"

export default function App() {
  return (
    <StoreProvider>
      <FocusScreen />
    </StoreProvider>
  )
}

import { db, indexes, Provider } from "./db"
import FocusScreen from "./screens/focus-screen"

export default function App() {
  return (
    <Provider indexes={indexes} store={db}>
      <FocusScreen />
    </Provider>
  )
}

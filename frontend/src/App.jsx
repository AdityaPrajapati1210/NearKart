import { useEffect } from "react";
import { useDispatch } from "react-redux";

import AppRouter from "./router/AppRouter";
import { checkAuth } from "./store/authThunks";

function App() {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(checkAuth());
    }, [dispatch]);

    return <AppRouter />;
}

export default App;
// import axios from "axios";

// console.log("API URL:", process.env.REACT_APP_API_URL);

// // Create an Axios instance
// const api = axios.create({
//   baseURL: `${process.env.REACT_APP_API_URL}/api`,
//   headers: {
//     "Content-Type": "application/json",
//     Accept: "application/json",
//   },
//   withCredentials: true,
// });

// // Add a request interceptor to include JWT and CSRF tokens
// api.interceptors.request.use(
//   async (config) => {
//     const token = localStorage.getItem("JWT_TOKEN");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     let csrfToken = localStorage.getItem("CSRF_TOKEN");
//     if (!csrfToken) {
//       try {
//         const response = await axios.get(
//           `${process.env.REACT_APP_API_URL}/api/csrf-token`,
//           { withCredentials: true }
//         );
//         csrfToken = response.data.token;
//         localStorage.setItem("CSRF_TOKEN", csrfToken);
//       } catch (error) {
//         console.error("Failed to fetch CSRF token", error);
//       }
//     }

//     if (csrfToken) {
//       config.headers["X-XSRF-TOKEN"] = csrfToken;
//     }
//     console.log("X-XSRF-TOKEN " + csrfToken);
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// export default api;






import axios from "axios";

// Create an Axios instance
const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Add a request interceptor to include JWT and CSRF tokens
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("JWT_TOKEN");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    let csrfToken = localStorage.getItem("CSRF_TOKEN");
    if (!csrfToken) {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/csrf-token`,
          { withCredentials: true }
        );
        csrfToken = response.data.token;
        localStorage.setItem("CSRF_TOKEN", csrfToken);
      } catch (error) {
        console.error("Failed to fetch CSRF token", error);
      }
    }

    if (csrfToken) {
      config.headers["X-XSRF-TOKEN"] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle CSRF token expiration
api.interceptors.response.use(
  (response) => {
    return response; // If response is successful, just return it
  },
  async (error) => {
    const originalRequest = error.config;
    // Check if error is due to CSRF token expiry (typically 401 or a specific error message)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Prevent infinite retry loops
      try {
        const newCsrfToken = await fetchCsrfToken(); // Fetch a new CSRF token
        originalRequest.headers["X-XSRF-TOKEN"] = newCsrfToken; // Update the header with the new token
        // Retry the original request with the new CSRF token
        return api(originalRequest);
      } catch (tokenRefreshError) {
        return Promise.reject(tokenRefreshError); // If token refresh fails, reject the promise
      }
    }
    return Promise.reject(error); // If error is not due to CSRF, reject it as usual
  }
);

// Function to fetch a new CSRF token (you need to define this)
async function fetchCsrfToken() {
  try {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/csrf-token`, {
      withCredentials: true,
    });
    return response.data.token;
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
    throw error; // You may want to handle this more gracefully
  }
}

export default api;

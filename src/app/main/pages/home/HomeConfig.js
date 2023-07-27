

import Home from './Home';


const HomeConifg = {
  settings: {
    layout: {
      config: {
        footer: {
          display: false,
        },
      },
    },
  },
  routes: [
    {
      path: '/',
      element: <Home />,
    },
  ],
};

export default HomeConifg;


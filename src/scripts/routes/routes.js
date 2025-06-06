import HomePage from '../pages/home/home-page';
import AddPage from '../pages/add/add-page';
import LoginPage from '../pages/login/login-page';
import RegisterPage from '../pages/register/register-page';
import ResetPage from '../pages/reset/reset-page';
import LikedPage from '../pages/liked/liked-page';

const routes = {
  '/': new HomePage(),
  '/add': new AddPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/reset': new ResetPage(),
  '/liked': new LikedPage(),
};

export default routes;

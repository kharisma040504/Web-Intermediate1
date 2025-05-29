import HomePage from "../pages/home/home-page";
import AboutPage from "../pages/about/about-page";
import LoginPage from "../pages/auth/login-page";
import RegisterPage from "../pages/auth/register-page";
import AddStoryPage from "../pages/story/add-story-page";
import DetailStoryPage from "../pages/story/detail-story-page";
import BookmarkPage from "../pages/bookmark/bookmark-page";
import NotFoundPage from "../pages/not-found/not-found-page";

const routes = {
  "/": HomePage,
  "/about": AboutPage,
  "/login": LoginPage,
  "/register": RegisterPage,
  "/add": AddStoryPage,
  "/story/:id": DetailStoryPage,
  "/bookmarks": BookmarkPage,
  "/404": NotFoundPage,
};

export default routes;

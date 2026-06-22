import type { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import authReducer from '@/redux/authSlice';
import usersReducer from '@/redux/usersSlice';
import projectsReducer from '@/redux/projectsSlice';
import tasksReducer from '@/redux/tasksSlice';
import commentsReducer from '@/redux/commentsSlice';
import tagsReducer from '@/redux/tagsSlice';

export const makeTestStore = (preloadedState?: Record<string, unknown>) =>
  configureStore({
    reducer: {
      auth: authReducer,
      users: usersReducer,
      projects: projectsReducer,
      tasks: tasksReducer,
      comments: commentsReducer,
      tags: tagsReducer,
    },
    preloadedState: preloadedState as never,
  });

export type TestStore = ReturnType<typeof makeTestStore>;

/** Render a component wrapped in a real Redux store (router is mocked per-file). */
export const renderWithStore = (ui: ReactElement, store: TestStore = makeTestStore()) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, ...render(ui, { wrapper }) };
};

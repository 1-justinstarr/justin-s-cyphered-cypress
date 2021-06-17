import { DefineComponent } from 'vue'

declare module '*.vue' {
  const component: DefineComponent
  export default component
}

declare module '*.vue.ts' {
  const component: DefineComponent
  export default component
} 
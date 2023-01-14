declare module 'style9/babel' {
  function plugin(...args: any[]): any;
  export = plugin;
}

declare module 'next/dist/compiled/browserslist' {
  import * as m from 'browserslist';
  export = m;
}

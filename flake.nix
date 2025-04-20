{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  } @ inputs:
    flake-utils.lib.eachDefaultSystem
    (
      system: let
        pkgs = import nixpkgs {inherit system;};
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [alejandra nodejs self.packages.${system}.regen_js];
        };

        packages.build-bookmarklet = pkgs.writeShellApplication {
          name = "build-bookmarklet";

          runtimeInputs = with pkgs; [nodejs];

          # code used from https://github.com/rafaelrinaldi/bookmarkletify
          text = ''
            if [ "$#" -gt 0 ]; then
              minified=$(echo "$1" | npx uglify-js)
            else
              minified=$(npx uglify-js)
            fi

            encoded=$(node -p "encodeURIComponent('$minified')")
            bookmarklet="javascript:(function(){;$encoded;})()"

            echo -n "$bookmarklet"
          '';
        };

        packages.regen_js = pkgs.writeShellApplication {
          name = "regen_js";
          
          runtimeInputs = with pkgs; [nodejs self.packages.${system}.build-bookmarklet];

          text = ''
            file="src/pretty.ts"
            generated="build/$file.js"

            npx tsc "$file" --outFile "$generated"
            < "$generated" build-bookmarklet > "$(dirname "$file")/min.js"
          '';
        };
      }
    );
}
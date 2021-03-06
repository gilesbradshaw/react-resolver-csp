import assert from "assert";
import { Container, Resolver } from "../dist";
import React, { Component} from "react/addons"; /* eslint no-unused-vars:0*/

import csp, {chan, alts, take, put, go, timeout} from "../dist/js-csp/src/csp"; /*eslint no-unused-vars:0 */

import ContextFixture from "./support/ContextFixture";
import PropsFixture from "./support/PropsFixture";

import PropsFixtureContainer from "./support/PropsFixtureContainer";


describe("<Container />", function() {
  beforeEach(function() {
    this.resolver = new Resolver();
  });

  describe(".props", function() {
    describe(".children", function() {
      it("should pass `parent` & `resolver` to child context", function() {
        const actual = React.renderToStaticMarkup(
          <Container resolver={this.resolver}><ContextFixture /></Container>
        );

        assert.equal(actual, "<code>[parent, resolver]</code>");
      });
    });

    describe(".component", function() {
      it("should pass `parent` & `resolver` to child context", function() {
        const actual = React.renderToStaticMarkup(
          <Container component={ContextFixture} resolver={this.resolver} />
        );

        assert.equal(actual, "<code>[parent, resolver]</code>");
      });
    });

    describe(".element", function() {
      it("should pass `parent` & `resolver` to child context", function() {
        const actual = React.renderToStaticMarkup(
          <Container element={<ContextFixture />} resolver={this.resolver} />
        );

        assert.equal(actual, "<code>[parent, resolver]</code>");
      });
    });

    describe(".resolve", function() {
      const element = 
        <Container component={PropsFixture} resolve={{
          user: () => 
            go(function* (){
                yield timeout(0);
                return "Eric";
            })
        }} />;
      it("should resolve keys", function(done) {
        const expected = React.renderToStaticMarkup(
          <PropsFixture user="Eric" />
        );
        go(function* (){
          let markup= yield take(Resolver.renderToStaticMarkup(element));
          assert.equal(expected,markup.toString());
          done();
        });        
      });
      
      it("should resolve a key where the channel closes", function(done) {
        const element = 
          <Container component={PropsFixture} resolve={{
            user: () => 
              go(function* (){
                  yield timeout(0);
              })
          }} />;

        const expected = React.renderToStaticMarkup(
          <PropsFixture user={undefined} />
        );
        go(function* (){
          let markup= yield take(Resolver.renderToStaticMarkup(element));
          console.log(markup.toString());
          assert.equal(expected,markup.toString());
          done();
        });        
      });
      context("when keys are already defined in props", function() {
        before(function() {
          this.props = { user: "Exists" };
        });

        it("should not resolve keys", function() {
          React.renderToStaticMarkup(
            <Container
              component={PropsFixture}
              resolve={{
                user: function() { throw new Error("`user` should not have been called"); },
              }}
              resolver={this.resolver}
              {...this.props}/>
          );
        });

        it("should render immediately", function() {
          const actual = React.renderToStaticMarkup(
            <Container
              component={PropsFixture}
              resolve={{
                user: function() { return "Waiting..."; },
              }}
              resolver={this.resolver}
              {...this.props}/>
          );

          assert.equal(actual, `<code>${JSON.stringify(this.props)}</code>`);
        });
      });

      context("when keys are rehydrating", function() {
        before(function() {
          global.__resolver__ = {
            ".0": {
              values: {
                fulfilled: false,
                rejected: false,
                user: "Exists",
              },
            },
          };
        });

        after(function() {
          delete global.__resolver__;
        });

        it("should not resolve keys", function() {
          React.renderToStaticMarkup(
            <Container
              component={PropsFixture}
              resolve={{
                user: function() { throw new Error("`user` should not have been called"); },
              }}
              resolver={this.resolver}/>
          );
        });

        it("should render immediately", function() {
          const actual = React.renderToStaticMarkup(
            <Container
              component={PropsFixture}
              resolve={{
                user: function() { return "Waiting..."; },
              }}
              resolver={this.resolver}/>
          );

          assert.equal(actual, `<code>${JSON.stringify(global.__resolver__[".0"].values)}</code>`);
        });
      });
    });

    describe(".resolver", function() {
      it("should store state for plain <Container />s", function() {
        React.renderToStaticMarkup(
          <Container resolver={this.resolver}>
            <PropsFixture />
          </Container>
        );

        const ids = Object.keys(this.resolver.states);

        assert.equal(1, ids.length);
        assert.deepEqual([".0"], ids);
      });

      it("should store state for `Resolver.createContainer`s", function() {
        React.renderToStaticMarkup(
          <Container resolver={this.resolver}>
            <PropsFixtureContainer />
          </Container>
        );

        const ids = Object.keys(this.resolver.states);

        assert.equal(2, ids.length);
        assert.deepEqual([".0", ".0.0"], ids);
      });
    });
  });
});

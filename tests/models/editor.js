/* Mocks */
var Kinetic = {
    Stage: function() {
        this.add = function() {};
    },
    Layer: function() {},
};

var Sketch = {
    LiveCollection: function() {}
};
/* end Mocks */


describe("WebvfxEditor", function() {

    before(function() {
        this.webvfxEditor = new WebvfxEditor({
            width: 1920,
            height: 1080,
            scale: .5,
        });
        window.webvfxEditor = this.webvfxEditor;
        console.log('hey');
    });

    it("The scaled width must be 960", function() {
        expect( this.webvfxEditor.getScaledWidth() ).equals(960);
    });

    it("The scaled height must be 540", function() {
        expect( this.webvfxEditor.getScaledHeight() ).equals(540);
    });

});

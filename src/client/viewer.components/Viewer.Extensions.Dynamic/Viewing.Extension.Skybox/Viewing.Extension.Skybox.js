/////////////////////////////////////////////////////////////////////
// Viewing.Extension.Skybox
// by Philippe Leefsma, July 2017
//
/////////////////////////////////////////////////////////////////////
import MultiModelExtensionBase from 'Viewer.MultiModelExtensionBase'
import xpos from './img/bridge/skybox-xpos.png'
import xneg from './img/bridge/skybox-xneg.png'
import ypos from './img/bridge/skybox-ypos.png'
import yneg from './img/bridge/skybox-yneg.png'
import zpos from './img/bridge/skybox-zpos.png'
import zneg from './img/bridge/skybox-zneg.png'
import EventTool from 'Viewer.EventTool'
import Skybox from 'Viewer.Skybox'
import Stopwatch from 'Stopwatch'

class SkyboxExtension extends MultiModelExtensionBase {

  /////////////////////////////////////////////////////////
  // Class constructor
  //
  /////////////////////////////////////////////////////////
  constructor(viewer, options) {

    super (viewer, options)

    this.onCameraChanged =
      this.onCameraChanged.bind(this)

    this.runAnimation =
      this.runAnimation.bind(this)

    this.eventTool = new EventTool(viewer)

    const imageList = [
      xpos, xneg,
      ypos, yneg,
      zpos, zneg
    ]

    const size = new THREE.Vector3()

    size.fromArray(options.size || [10000, 10000, 10000])

    this.skybox = new Skybox(viewer, {
      imageList,
      size
    })

    this.stopwatch = new Stopwatch()
  }

  /////////////////////////////////////////////////////////
  // Extension Id
  //
  /////////////////////////////////////////////////////////
  static get ExtensionId() {

    return 'Viewing.Extension.Skybox'
  }

  /////////////////////////////////////////////////////////
  // Load callback
  //
  /////////////////////////////////////////////////////////
  load() {

    console.log('Viewing.Extension.Skybox loaded')

    this.eventTool.on('mousewheel', (e) => {

      window.clearTimeout(this.timeoutId)

      this.timeoutId = window.setTimeout(() => {
        this.stopwatch.getElapsedMs()
        this.userInteraction = false
        this.runAnimation()
      }, 3500)

      this.userInteraction = true

      return false
    })

    this.eventTool.on('buttondown', (e) => {

      window.clearTimeout(this.timeoutId)

      this.userInteraction = true

      return false
    })

    this.eventTool.on('buttonup', (e) => {

      this.timeoutId = window.setTimeout(() => {
        this.stopwatch.getElapsedMs()
        this.runAnimation()
      }, 3500)

      this.userInteraction = false

      return false
    })

    this.viewer.addEventListener(
      Autodesk.Viewing.CAMERA_CHANGE_EVENT,
      this.onCameraChanged)

    return true
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  configureNavigation () {

    const nav = this.viewer.navigation

    nav.setLockSettings({
      pan: true
    })

    const bounds = new THREE.Box3(
      new THREE.Vector3(-100, -100, -100),
      new THREE.Vector3(100, 100, 100))

    nav.fitBounds(true, bounds)

    //this.viewer.navigation.setPosition(
    //  new THREE.Vector3(150, 0, 150))

    this.viewer.setViewCube('front')

    nav.toPerspective()

    setTimeout(() => {
      this.viewer.autocam.setHomeViewFrom(
        nav.getCamera())
    }, 2000)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  onModelCompletedLoad (event) {

    if (event.model.dbModelId) {

      this.loadContainer(this.options.containerURN).then(
        () => {

          this.configureNavigation()

          this.options.loader.show(false)
        })

      this.stopwatch.getElapsedMs()

      this.eventTool.activate()

      this.runAnimation()
    }
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  loadContainer (urn) {

    return new Promise(async(resolve) => {

      const doc = await this.options.loadDocument(urn)

      const path = this.options.getViewablePath(doc)

      this.viewer.loadModel(path, {}, (model) => {

        resolve (model)
      })
    })
  }

  /////////////////////////////////////////////////////////
  // Unload callback
  //
  /////////////////////////////////////////////////////////
  unload() {

    console.log('Viewing.Extension.Skybox unloaded')

    window.cancelAnimationFrame(this.animId)

    this.viewer.removeEventListener(
      Autodesk.Viewing.CAMERA_CHANGE_EVENT,
      this.onCameraChanged)

    this.userInteraction = true

    this.eventTool.off()
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  clampLength(vector, min, max ) {

    const length = vector.length()

    vector.divideScalar(length || 1)

    vector.multiplyScalar(
      Math.max(min, Math.min(max, length)))
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  onCameraChanged () {

    const nav = this.viewer.navigation

    const pos = nav.getPosition()

    const target = nav.getTarget()

    //if (target.length() > 10.0) {
    //
    //  nav.setTarget(new THREE.Vector3(0,0,0))
    //}

    if (pos.length() > 700.0 || pos.length() < 100.0) {

      this.clampLength(pos, 100.0, 700.0)

      nav.setView(pos, new THREE.Vector3(0,0,0))
    }
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  rotateCamera (axis, speed, dt) {

    const nav = this.viewer.navigation

    const pos = nav.getPosition()

    const matrix = new THREE.Matrix4().makeRotationAxis(
      axis, speed * dt);

    pos.applyMatrix4(matrix)

    nav.setPosition(pos)
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  runAnimation () {

    if (!this.userInteraction) {

      const dt = this.stopwatch.getElapsedMs() * 0.001

      const axis = new THREE.Vector3(0,1,0)

      this.rotateCamera(axis, 10.0 * Math.PI/180, dt)

      this.animId = window.requestAnimationFrame(
        this.runAnimation)
    }
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  SkyboxExtension.ExtensionId,
  SkyboxExtension)

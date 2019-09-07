define(function (require, exports, module) {
  "use strict";

  //Brackets 提供モジュールの定義
  const CommandManager = brackets.getModule("command/CommandManager");
  const EditorManager  = brackets.getModule("editor/EditorManager");
  const DocumentManager  = brackets.getModule("document/DocumentManager");
  const KeyBindingManager = brackets.getModule("command/KeyBindingManager");
  const Menus = brackets.getModule("command/Menus");

  //action() を登録するための ID
  const CAMEL_ID = 'dressedcamelsnake.toCamel';
  const SNAKE_ID = 'dressedcamelsnake.toSnake';

  //モードの種類、切り替え、文字列切り替え、アニメーションを内包
  class Mode {

    /**
     * プロパティ設定
     */
    constructor() {
      this.config = 'camel';
    }

    /**
     * config を返す
     * @param {string} string
     */
    setConfig(string) {
      this.config = string === 'camel'
        ? 'camel'
        : 'snake';
    }

    /**
     * string を現在の config に応じて変換する
     * @param {string} string
     */
    convert(string) {
      return this.config === 'camel'
        ? string.replace(/([^\s])(_.)/g, (match, p1, p2) => {
          return p2.charAt(1).match(/[a-z]/)
            ? p1+p2.charAt(1).toUpperCase()
            : match;
        })
        : string.replace(/[a-z][A-Z]/g, (match) => {
          return match.charAt(0)+'_'+match.charAt(1).toLowerCase();
        });
    }

  };

  //Mode クラスのインスタンスを作成
  const mode = new Mode();

  /**
   * Editor と Document の両方があった場合にのみそれぞれを返す
   * どちらか片方でも欠けていたら null を返す
   * @return {{editor: *, document: *}|null}
   */
  const getTargets = () => {
    //エディタを入手
    const editor = EditorManager.getFocusedEditor();

    //エディタが存在しなければ null を返す
    if ( ! editor) {
      console.log('editor がないよ');
      return null;
    }

    //ドキュメントを入手
    const document = DocumentManager.getCurrentDocument();

    //ドキュメントが存在しなければ null を返す
    if ( ! document) {
      console.log('document がないよ');
      return null;
    }

    //二つをまとめて返す
    return {editor, document};
  };

  //実行関数
  const run = (string) => {
    //mode.config を設定
    mode.setConfig(string);

    //Editor と Document を入手
    const TARGET =  getTargets();

    //情報が足りていなかったら何もしない
    if (TARGET === null) {
      return;
    }

    //選択範囲の文字を置換対象として取得
    let selection = TARGET.editor.getSelectedText();

    //置換範囲の始点として現在のカーソルのポジションを取得
    let start = TARGET.editor.getCursorPos(false, 'start');

    //置換範囲の終点として現在のカーソルのポジションを取得
    let end = TARGET.editor.getCursorPos(false, 'end');

    //もし選択範囲が存在しなかったら全体を置換する
    if (selection.length === 0) {
      //文章全体を入手
      selection = TARGET.document.getText();

      //置換範囲の始点を 0 にする
      start = {line: 0, ch: 0};

      //最終行の行番号
      const lastLineNumber = TARGET.editor.getLastVisibleLine();

      //終点の座標を求める
      end = {
        line: lastLineNumber,
        ch: TARGET.document.getLine(lastLineNumber).length
      };
    }

    //指定範囲を置換する
    TARGET.document.replaceRange(mode.convert(selection), start, end);
  };

  //キャメルケースに変換
  const toCamel = () => {
    run('camel');
  };

  //スネークケースに変換
  const toSnake = () => {
    run('snake');
  };

  //action() を Brackets に登録
  CommandManager.register('Convert camelCase', CAMEL_ID, toCamel);
  CommandManager.register('Convert snakeCase', SNAKE_ID, toSnake);

  //右クリック追加
  Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU).addMenuDivider();
  Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU).addMenuItem(CAMEL_ID);
  Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU).addMenuItem(SNAKE_ID);
  Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU).addMenuDivider();

  //ショートカットキー追加
  KeyBindingManager.addBinding(CAMEL_ID, 'Shift-Alt-C');
  KeyBindingManager.addBinding(SNAKE_ID, 'Shift-Alt-S');
});
